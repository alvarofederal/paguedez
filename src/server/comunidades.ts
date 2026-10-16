import "server-only"
import { randomBytes } from "node:crypto"
import prisma from "@/lib/prisma"
import { LIMITES_SOCIAL } from "@/lib/planos"
import { primeiroNome, type CorComunidade } from "@/lib/comunidade"
import type { NivelVisibilidade } from "@/lib/visibilidade"
import { sincronizarEmblemasSemErro } from "./emblemas"

export type DadosComunidade = {
  nome: string
  descricao?: string
  cor: CorComunidade
  /** Quem decide é o DONO: o que os membros enxergam uns dos outros. */
  nivelVisibilidade: NivelVisibilidade
}

const novoCodigo = () => randomBytes(6).toString("base64url")

export async function criarComunidade(donoId: string, dados: DadosComunidade) {
  const jaCriadas = await prisma.comunidade.count({ where: { donoId } })
  if (jaCriadas >= LIMITES_SOCIAL.comunidadesPorUsuario) {
    return { erro: `Você já comanda ${LIMITES_SOCIAL.comunidadesPorUsuario} pelotões. É o limite por comandante.` }
  }

  const comunidade = await prisma.$transaction(async (tx) => {
    const c = await tx.comunidade.create({
      data: {
        donoId,
        nome: dados.nome,
        descricao: dados.descricao || null,
        cor: dados.cor,
        nivelVisibilidade: dados.nivelVisibilidade,
        codigoEntrada: novoCodigo(),
      },
    })
    await tx.membroComunidade.create({ data: { comunidadeId: c.id, userId: donoId, papel: "DONO" } })
    return c
  })

  await sincronizarEmblemasSemErro(donoId)
  return { erro: null, id: comunidade.id }
}

export async function listarMinhasComunidades(userId: string) {
  const meus = await prisma.membroComunidade.findMany({ where: { userId }, select: { comunidadeId: true, papel: true } })
  if (meus.length === 0) return []

  const ids = meus.map((m) => m.comunidadeId)
  const [comunidades, contagens] = await Promise.all([
    prisma.comunidade.findMany({ where: { id: { in: ids } }, orderBy: { criadoEm: "desc" } }),
    prisma.membroComunidade.groupBy({ by: ["comunidadeId"], where: { comunidadeId: { in: ids } }, _count: { _all: true } }),
  ])
  const total = new Map(contagens.map((c) => [c.comunidadeId, c._count._all]))
  const papel = new Map(meus.map((m) => [m.comunidadeId, m.papel]))

  return comunidades.map((c) => ({ ...c, membros: total.get(c.id) ?? 0, meuPapel: papel.get(c.id)! }))
}

/** Só quem é membro enxerga o pelotão (para os outros, é como se não existisse). */
export async function obterComunidade(id: string, viewerId: string) {
  const meu = await prisma.membroComunidade.findUnique({ where: { comunidadeId_userId: { comunidadeId: id, userId: viewerId } } })
  if (!meu) return null
  const comunidade = await prisma.comunidade.findUnique({ where: { id } })
  if (!comunidade) return null

  const membros = await prisma.membroComunidade.findMany({ where: { comunidadeId: id }, orderBy: { entrouEm: "asc" } })
  const usuarios = await prisma.user.findMany({
    where: { id: { in: membros.map((m) => m.userId) }, ativo: true },
    select: { id: true, name: true },
  })
  const nomes = new Map(usuarios.map((u) => [u.id, u.name]))

  return {
    comunidade,
    meuPapel: meu.papel,
    membros: membros.flatMap((m) => (nomes.has(m.userId) ? [{ userId: m.userId, name: nomes.get(m.userId)!, papel: m.papel, entrouEm: m.entrouEm }] : [])),
  }
}

/** Prévia pública (página do link de entrada): nada além do necessário para decidir entrar. */
export async function consultarPorCodigo(codigo: string) {
  const c = await prisma.comunidade.findUnique({ where: { codigoEntrada: codigo } })
  if (!c) return null
  const [dono, membros] = await Promise.all([
    prisma.user.findUnique({ where: { id: c.donoId }, select: { name: true, ativo: true } }),
    prisma.membroComunidade.count({ where: { comunidadeId: c.id } }),
  ])
  return {
    id: c.id,
    nome: c.nome,
    descricao: c.descricao,
    cor: c.cor,
    entradaAtiva: c.entradaAtiva && !!dono?.ativo,
    donoNome: dono ? primeiroNome(dono.name) : "Comandante",
    membros,
  }
}

export async function ehMembro(userId: string, comunidadeId: string): Promise<boolean> {
  const m = await prisma.membroComunidade.findUnique({ where: { comunidadeId_userId: { comunidadeId, userId } } })
  return m !== null
}

export async function entrarPorCodigo(userId: string, codigo: string) {
  const c = await prisma.comunidade.findUnique({ where: { codigoEntrada: codigo } })
  if (!c || !c.entradaAtiva) return { erro: "Este link de entrada não está mais disponível." }

  const ja = await prisma.membroComunidade.findUnique({ where: { comunidadeId_userId: { comunidadeId: c.id, userId } } })
  if (ja) return { erro: null, id: c.id }

  const membros = await prisma.membroComunidade.count({ where: { comunidadeId: c.id } })
  if (membros >= LIMITES_SOCIAL.membrosPorComunidade) return { erro: "O pelotão está lotado." }

  await prisma.membroComunidade.create({ data: { comunidadeId: c.id, userId } })
  return { erro: null, id: c.id }
}

export async function sairDaComunidade(userId: string, comunidadeId: string) {
  const m = await prisma.membroComunidade.findUnique({ where: { comunidadeId_userId: { comunidadeId, userId } } })
  if (!m) return { erro: "Você não está neste pelotão." }
  if (m.papel === "DONO") return { erro: "O comandante não pode abandonar o pelotão. Exclua-o ou passe a missão adiante." }
  await prisma.membroComunidade.delete({ where: { comunidadeId_userId: { comunidadeId, userId } } })
  return { erro: null }
}

async function comoDono(donoId: string, comunidadeId: string) {
  const c = await prisma.comunidade.findUnique({ where: { id: comunidadeId } })
  return c && c.donoId === donoId ? c : null
}

export async function removerMembro(donoId: string, comunidadeId: string, userId: string) {
  if (!(await comoDono(donoId, comunidadeId))) return { erro: "Só o comandante pode fazer isso." }
  if (userId === donoId) return { erro: "O comandante não pode ser removido." }
  await prisma.membroComunidade.deleteMany({ where: { comunidadeId, userId } })
  return { erro: null }
}

export async function atualizarComunidade(
  donoId: string,
  comunidadeId: string,
  dados: DadosComunidade & { entradaAtiva: boolean }
) {
  if (!(await comoDono(donoId, comunidadeId))) return { erro: "Só o comandante pode fazer isso." }
  await prisma.comunidade.update({
    where: { id: comunidadeId },
    data: {
      nome: dados.nome,
      descricao: dados.descricao || null,
      cor: dados.cor,
      nivelVisibilidade: dados.nivelVisibilidade,
      entradaAtiva: dados.entradaAtiva,
    },
  })
  return { erro: null }
}

export async function excluirComunidade(donoId: string, comunidadeId: string) {
  if (!(await comoDono(donoId, comunidadeId))) return { erro: "Só o comandante pode fazer isso." }
  await prisma.$transaction([
    prisma.convite.updateMany({ where: { comunidadeId, status: "PENDENTE" }, data: { status: "CANCELADO" } }),
    prisma.membroComunidade.deleteMany({ where: { comunidadeId } }),
    prisma.comunidade.delete({ where: { id: comunidadeId } }),
  ])
  return { erro: null }
}
