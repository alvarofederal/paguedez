"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { usuarioAtual } from "@/lib/auth"
import { z } from "zod"
import { idSchema, inscricaoPushSchema, lembreteSchema } from "@/lib/validators"
import { atualizarLembrete, criarLembrete, enviarTeste, excluirLembrete } from "@/server/lembretes"
import { pushConfigurado, removerInscricao, salvarInscricao } from "@/server/push"

const SEM_SESSAO = { erro: "Sessão expirada. Entre novamente." } as const
const SEM_PUSH = { erro: "As notificações ainda não estão configuradas no servidor." } as const

export async function salvarInscricaoAction(dados: unknown) {
  const user = await usuarioAtual()
  if (!user) return SEM_SESSAO
  if (!pushConfigurado()) return SEM_PUSH
  const v = inscricaoPushSchema.safeParse(dados)
  if (!v.success) return { erro: "Inscrição de notificação inválida." }

  const agente = (await headers()).get("user-agent") ?? undefined
  await salvarInscricao(user.id, v.data, agente)
  revalidatePath("/lembretes")
  return { erro: null }
}

export async function removerInscricaoAction(endpoint: string) {
  const user = await usuarioAtual()
  if (!user) return SEM_SESSAO
  const v = inscricaoPushSchema.shape.endpoint.safeParse(endpoint)
  if (!v.success) return { erro: "Endereço inválido." }
  await removerInscricao(user.id, v.data)
  revalidatePath("/lembretes")
  return { erro: null }
}

export async function enviarTesteAction() {
  const user = await usuarioAtual()
  if (!user) return SEM_SESSAO
  if (!pushConfigurado()) return SEM_PUSH
  return enviarTeste(user.id)
}

export async function criarLembreteAction(dados: unknown) {
  const user = await usuarioAtual()
  if (!user) return SEM_SESSAO
  const v = lembreteSchema.safeParse(dados)
  if (!v.success) return { erro: v.error.issues[0]?.message ?? "Dados inválidos" }
  const r = await criarLembrete(user.id, v.data)
  revalidatePath("/lembretes")
  return r
}

export async function atualizarLembreteAction(id: string, dados: unknown) {
  const user = await usuarioAtual()
  if (!user) return SEM_SESSAO
  const i = idSchema.safeParse(id)
  const v = lembreteSchema.partial().extend({ ativo: z.boolean().optional() }).safeParse(dados)
  if (!i.success || !v.success) return { erro: "Dados inválidos" }
  const r = await atualizarLembrete(user.id, i.data, v.data)
  revalidatePath("/lembretes")
  return r
}

export async function excluirLembreteAction(id: string) {
  const user = await usuarioAtual()
  if (!user) return SEM_SESSAO
  const i = idSchema.safeParse(id)
  if (!i.success) return { erro: "Dados inválidos" }
  const r = await excluirLembrete(user.id, i.data)
  revalidatePath("/lembretes")
  return r
}

