"use server"

import { revalidatePath } from "next/cache"
import { usuarioAtual } from "@/lib/auth"
import { socialAtivo } from "@/lib/social-flag"
import { comunidadeSchema, conviteSchema, idSchema, nivelSchema, tokenSchema } from "@/lib/validators"
import { aceitarConvite, cancelarConvite, criarConvite, reenviarConvite } from "@/server/convites"
import { definirMinhaVisibilidade, desfazerAmizade } from "@/server/amizades"
import {
  atualizarComunidade,
  convocarAmigo,
  criarComunidade,
  entrarPorCodigo,
  excluirComunidade,
  removerMembro,
  responderConvocacao,
  sairDaComunidade,
} from "@/server/comunidades"
import { origemDoSite } from "@/server/social"

// Toda ação social exige: recurso ligado + usuário logado e ativo. Entrada sempre validada com Zod.
async function entrada() {
  if (!socialAtivo()) return null
  return usuarioAtual()
}

const SEM_SESSAO = { erro: "Sessão expirada. Entre novamente." } as const
const primeiroErro = (e: { issues: { message: string }[] }) => e.issues[0]?.message ?? "Dados inválidos"

// ── Convites ────────────────────────────────────────────────────────────

export async function criarConviteAction(dados: unknown) {
  const user = await entrada()
  if (!user) return SEM_SESSAO
  const v = conviteSchema.safeParse(dados)
  if (!v.success) return { erro: primeiroErro(v.error) }

  const r = await criarConvite({ id: user.id, name: user.name }, v.data, await origemDoSite())
  revalidatePath("/convidar")
  return r.erro === null ? { erro: null, link: r.link, texto: r.texto, whatsappUrl: r.whatsappUrl, mascara: r.mascara, reenviado: r.reenviado } : { erro: r.erro }
}

export async function reenviarConviteAction(conviteId: string) {
  const user = await entrada()
  if (!user) return SEM_SESSAO
  const id = idSchema.safeParse(conviteId)
  if (!id.success) return { erro: "Convite inválido" }

  const r = await reenviarConvite({ id: user.id, name: user.name }, id.data, await origemDoSite())
  revalidatePath("/convidar")
  return r.erro === null ? { erro: null, link: r.link, whatsappUrl: r.whatsappUrl } : { erro: r.erro }
}

export async function cancelarConviteAction(conviteId: string) {
  const user = await entrada()
  if (!user) return SEM_SESSAO
  const id = idSchema.safeParse(conviteId)
  if (!id.success) return { erro: "Convite inválido" }

  const r = await cancelarConvite(user.id, id.data)
  revalidatePath("/convidar")
  return r
}

export async function aceitarConviteAction(token: string, nivel: number) {
  const user = await entrada()
  if (!user) return SEM_SESSAO
  const t = tokenSchema.safeParse(token)
  const n = nivelSchema.safeParse(nivel)
  if (!t.success || !n.success) return { erro: "Convite inválido" }

  const r = await aceitarConvite(user.id, t.data, n.data)
  if (r.erro !== null) return { erro: r.erro }
  revalidatePath("/tropa")
  revalidatePath("/comunidades")
  return { erro: null, comunidadeId: r.comunidadeId }
}

// ── Amigos ──────────────────────────────────────────────────────────────

export async function definirVisibilidadeAction(amigoId: string, nivel: number) {
  const user = await entrada()
  if (!user) return SEM_SESSAO
  const id = idSchema.safeParse(amigoId)
  const n = nivelSchema.safeParse(nivel)
  if (!id.success || !n.success) return { erro: "Dados inválidos" }

  const r = await definirMinhaVisibilidade(user.id, id.data, n.data)
  revalidatePath("/tropa")
  return r
}

export async function desfazerAmizadeAction(amigoId: string) {
  const user = await entrada()
  if (!user) return SEM_SESSAO
  const id = idSchema.safeParse(amigoId)
  if (!id.success) return { erro: "Dados inválidos" }

  const r = await desfazerAmizade(user.id, id.data)
  revalidatePath("/tropa")
  return r
}

// ── Comunidades ─────────────────────────────────────────────────────────

export async function criarComunidadeAction(dados: unknown) {
  const user = await entrada()
  if (!user) return SEM_SESSAO
  const v = comunidadeSchema.safeParse(dados)
  if (!v.success) return { erro: primeiroErro(v.error) }

  const r = await criarComunidade(user.id, v.data)
  revalidatePath("/comunidades")
  return r
}

export async function atualizarComunidadeAction(comunidadeId: string, dados: unknown, entradaAtiva: boolean) {
  const user = await entrada()
  if (!user) return SEM_SESSAO
  const id = idSchema.safeParse(comunidadeId)
  const v = comunidadeSchema.safeParse(dados)
  if (!id.success) return { erro: "Pelotão inválido" }
  if (!v.success) return { erro: primeiroErro(v.error) }

  const r = await atualizarComunidade(user.id, id.data, { ...v.data, entradaAtiva })
  revalidatePath(`/comunidades/${id.data}`)
  revalidatePath("/comunidades")
  return r
}

export async function excluirComunidadeAction(comunidadeId: string) {
  const user = await entrada()
  if (!user) return SEM_SESSAO
  const id = idSchema.safeParse(comunidadeId)
  if (!id.success) return { erro: "Pelotão inválido" }

  const r = await excluirComunidade(user.id, id.data)
  revalidatePath("/comunidades")
  return r
}

export async function sairDaComunidadeAction(comunidadeId: string) {
  const user = await entrada()
  if (!user) return SEM_SESSAO
  const id = idSchema.safeParse(comunidadeId)
  if (!id.success) return { erro: "Pelotão inválido" }

  const r = await sairDaComunidade(user.id, id.data)
  revalidatePath("/comunidades")
  return r
}

export async function removerMembroAction(comunidadeId: string, membroId: string) {
  const user = await entrada()
  if (!user) return SEM_SESSAO
  const c = idSchema.safeParse(comunidadeId)
  const m = idSchema.safeParse(membroId)
  if (!c.success || !m.success) return { erro: "Dados inválidos" }

  const r = await removerMembro(user.id, c.data, m.data)
  revalidatePath(`/comunidades/${c.data}`)
  return r
}

export async function entrarPorCodigoAction(codigo: string) {
  const user = await entrada()
  if (!user) return SEM_SESSAO
  const t = tokenSchema.safeParse(codigo)
  if (!t.success) return { erro: "Link inválido" }

  const r = await entrarPorCodigo(user.id, t.data)
  revalidatePath("/comunidades")
  return r
}

export async function convocarAmigoAction(comunidadeId: string, amigoId: string) {
  const user = await entrada()
  if (!user) return SEM_SESSAO
  const c = idSchema.safeParse(comunidadeId)
  const m = idSchema.safeParse(amigoId)
  if (!c.success || !m.success) return { erro: "Dados inválidos" }

  const r = await convocarAmigo(user.id, c.data, m.data)
  revalidatePath(`/comunidades/${c.data}`)
  return r
}

export async function responderConvocacaoAction(convocacaoId: string, aceitar: boolean) {
  const user = await entrada()
  if (!user) return SEM_SESSAO
  const id = idSchema.safeParse(convocacaoId)
  if (!id.success) return { erro: "Convocação inválida" }

  const r = await responderConvocacao(user.id, id.data, aceitar === true)
  revalidatePath("/comunidades")
  revalidatePath("/tropa")
  return r
}
