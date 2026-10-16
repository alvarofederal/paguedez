import "server-only"
import { randomBytes } from "node:crypto"
import prisma from "@/lib/prisma"
import { LIMITES_SOCIAL } from "@/lib/planos"
import { primeiroNome, type CorComunidade } from "@/lib/comunidade"
import type { NivelVisibilidade } from "@/lib/visibilidade"
import { parOrdenado } from "@/lib/amizade"
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

/** Ids dos pelotões de que o usuário faz parte (alimenta o item "Pelotão" do menu, que só existe depois de entrar num). */
export async function meusPelotoesIds(userId: string): Promise<string[]> {
  const meus = await prisma.membroComunidade.findMany({ where: { userId }, select: { comunidadeId: true } })
  return meus.map((m) => m.comunidadeId)
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
    prisma.convocacao.deleteMany({ where: { comunidadeId } }),
    prisma.membroComunidade.deleteMany({ where: { comunidadeId } }),
    prisma.comunidade.delete({ where: { id: comunidadeId } }),
  ])
  return { erro: null }
}

// ── Convocação de amigo que já está no app ───────────────────────────────

export type AmigoParaConvocar = { userId: string; name: string; pendente: boolean }

/** Amigos de quem está vendo que ainda NÃO estão no pelotão (marcando quem já foi convocado e não respondeu). */
export async function amigosParaConvocar(userId: string, comunidadeId: string): Promise<AmigoParaConvocar[]> {
  if (!(await ehMembro(userId, comunidadeId))) return []

  const amizades = await prisma.amizade.findMany({ where: { OR: [{ usuarioAId: userId }, { usuarioBId: userId }] } })
  const amigosIds = amizades.map((a) => (a.usuarioAId === userId ? a.usuarioBId : a.usuarioAId))
  if (amigosIds.length === 0) return []

  const [membros, pendentes, usuarios] = await Promise.all([
    prisma.membroComunidade.findMany({ where: { comunidadeId, userId: { in: amigosIds } }, select: { userId: true } }),
    prisma.convocacao.findMany({ where: { comunidadeId, convidadoId: { in: amigosIds }, status: "PENDENTE" }, select: { convidadoId: true } }),
    prisma.user.findMany({ where: { id: { in: amigosIds }, ativo: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ])
  const jaMembros = new Set(membros.map((m) => m.userId))
  const comPendencia = new Set(pendentes.map((p) => p.convidadoId))

  return usuarios.filter((u) => !jaMembros.has(u.id)).map((u) => ({ userId: u.id, name: u.name, pendente: comPendencia.has(u.id) }))
}

export async function convocarAmigo(userId: string, comunidadeId: string, amigoId: string) {
  if (userId === amigoId) return { erro: "Você já está no pelotão." }
  if (!(await ehMembro(userId, comunidadeId))) return { erro: "Só quem é do pelotão pode convocar." }

  // Só amigos conectados podem ser convocados (ninguém recebe convocação de estranho)
  const [a, b] = parOrdenado(userId, amigoId)
  const amizade = await prisma.amizade.findUnique({ where: { usuarioAId_usuarioBId: { usuarioAId: a, usuarioBId: b } } })
  if (!amizade) return { erro: "Esse usuário não é seu amigo na tropa." }

  const amigo = await prisma.user.findUnique({ where: { id: amigoId }, select: { ativo: true } })
  if (!amigo?.ativo) return { erro: "Esse amigo não está disponível." }
  if (await ehMembro(amigoId, comunidadeId)) return { erro: "Esse amigo já está no pelotão." }

  const membros = await prisma.membroComunidade.count({ where: { comunidadeId } })
  if (membros >= LIMITES_SOCIAL.membrosPorComunidade) return { erro: "O pelotão está lotado." }

  const existente = await prisma.convocacao.findUnique({ where: { comunidadeId_convidadoId: { comunidadeId, convidadoId: amigoId } } })
  if (existente?.status === "PENDENTE") return { erro: null, jaPendente: true }
  // Quem recusou não é incomodado de novo; quem aceitou e depois saiu pode ser chamado outra vez
  if (existente?.status === "RECUSADA") return { erro: "Esse amigo já respondeu à convocação deste pelotão." }

  if (existente) {
    await prisma.convocacao.update({
      where: { id: existente.id },
      data: { status: "PENDENTE", convidanteId: userId, criadoEm: new Date(), respondidoEm: null },
    })
  } else {
    await prisma.convocacao.create({ data: { comunidadeId, convidadoId: amigoId, convidanteId: userId } })
  }
  return { erro: null, jaPendente: false }
}

export async function listarConvocacoes(userId: string) {
  const pendentes = await prisma.convocacao.findMany({ where: { convidadoId: userId, status: "PENDENTE" }, orderBy: { criadoEm: "desc" } })
  if (pendentes.length === 0) return []

  const [pelotoes, quem] = await Promise.all([
    prisma.comunidade.findMany({ where: { id: { in: pendentes.map((p) => p.comunidadeId) } } }),
    prisma.user.findMany({ where: { id: { in: pendentes.map((p) => p.convidanteId) } }, select: { id: true, name: true } }),
  ])
  const pelotaoPorId = new Map(pelotoes.map((p) => [p.id, p]))
  const nomePorId = new Map(quem.map((u) => [u.id, u.name]))

  return pendentes.flatMap((p) => {
    const c = pelotaoPorId.get(p.comunidadeId)
    if (!c) return [] // pelotão excluído
    return [
      {
        id: p.id,
        comunidadeId: c.id,
        nome: c.nome,
        descricao: c.descricao,
        cor: c.cor,
        nivelVisibilidade: c.nivelVisibilidade,
        convidanteNome: primeiroNome(nomePorId.get(p.convidanteId) ?? "Um amigo"),
      },
    ]
  })
}

export async function responderConvocacao(userId: string, convocacaoId: string, aceitar: boolean, agora = new Date()) {
  return prisma.$transaction(
    async (tx) => {
      const conv = await tx.convocacao.findUnique({ where: { id: convocacaoId } })
      if (!conv || conv.convidadoId !== userId) return { erro: "Convocação não encontrada." }
      if (conv.status !== "PENDENTE") return { erro: "Você já respondeu a esta convocação." }

      if (!aceitar) {
        await tx.convocacao.update({ where: { id: conv.id }, data: { status: "RECUSADA", respondidoEm: agora } })
        return { erro: null, comunidadeId: null }
      }

      const com = await tx.comunidade.findUnique({ where: { id: conv.comunidadeId } })
      if (!com) return { erro: "Este pelotão não existe mais." }

      const total = await tx.membroComunidade.count({ where: { comunidadeId: com.id } })
      if (total >= LIMITES_SOCIAL.membrosPorComunidade) return { erro: "O pelotão está lotado." }

      const ja = await tx.membroComunidade.findUnique({ where: { comunidadeId_userId: { comunidadeId: com.id, userId } } })
      if (!ja) await tx.membroComunidade.create({ data: { comunidadeId: com.id, userId } })
      await tx.convocacao.update({ where: { id: conv.id }, data: { status: "ACEITA", respondidoEm: agora } })
      return { erro: null, comunidadeId: com.id }
    },
    { timeout: 20_000, maxWait: 10_000 }
  )
}
