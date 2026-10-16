import "server-only"
import prisma from "@/lib/prisma"
import {
  contarDias,
  ESCADA,
  indiceDaPatente,
  indiceMerecido,
  progressoParaProxima,
  recrutaEstaAtivo,
  type DefinicaoPatente,
  type EstatisticasPatente,
  type Patente,
} from "@/lib/patentes"
import { socialAtivo } from "@/lib/social-flag"

/** Recrutas ativos = amigos que aceitaram o convite e já pagaram flecas em dias suficientes. Só LÊ os registros. */
async function contarRecrutasAtivos(userId: string): Promise<number> {
  const convites = await prisma.convite.findMany({
    where: { convidanteId: userId, status: "ACEITO", aceitoPorId: { not: null } },
    select: { aceitoPorId: true },
  })
  const candidatos = [...new Set(convites.flatMap((c) => (c.aceitoPorId ? [c.aceitoPorId] : [])))].filter((id) => id !== userId)
  if (candidatos.length === 0) return 0

  const ativos = await prisma.user.findMany({ where: { id: { in: candidatos }, ativo: true }, select: { id: true } })
  const ids = ativos.map((u) => u.id)
  if (ids.length === 0) return 0

  const dias = await prisma.registro.groupBy({ by: ["userId", "dia"], where: { userId: { in: ids } }, _sum: { quantidade: true } })
  const porRecruta = new Map<string, number[]>()
  for (const d of dias) porRecruta.set(d.userId, [...(porRecruta.get(d.userId) ?? []), d._sum.quantidade ?? 0])

  return ids.filter((id) => recrutaEstaAtivo(porRecruta.get(id) ?? [])).length
}

export async function estatisticasDePatente(userId: string): Promise<EstatisticasPatente> {
  const [dias, recrutasAtivos] = await Promise.all([
    prisma.registro.groupBy({ by: ["dia"], where: { userId }, _sum: { quantidade: true } }),
    contarRecrutasAtivos(userId),
  ])
  const { flecasValidas, diasPagos } = contarDias(dias.map((d) => d._sum.quantidade ?? 0))
  return { flecasValidas, diasPagos, recrutasAtivos }
}

export type SituacaoPatente = {
  atual: DefinicaoPatente
  indice: number
  stats: EstatisticasPatente
  progresso: ReturnType<typeof progressoParaProxima>
  /** patentes conquistadas AGORA, nesta chamada (para comemorar). Vazio nas visitas seguintes. */
  novas: DefinicaoPatente[]
  conquistadas: { patente: Patente; conquistadoEm: Date }[]
}

/**
 * Calcula a patente merecida e promove se for o caso. A patente NUNCA desce: vale a mais alta já conquistada,
 * mesmo que depois uma série seja desfeita ou um recruta saia.
 */
export async function sincronizarPatente(userId: string): Promise<SituacaoPatente> {
  const exigirRecrutas = socialAtivo()
  const [stats, tenho] = await Promise.all([
    estatisticasDePatente(userId),
    prisma.patenteConquistada.findMany({ where: { userId }, select: { patente: true, conquistadoEm: true } }),
  ])

  const maiorJaTida = tenho.reduce((m, t) => Math.max(m, indiceDaPatente(t.patente as Patente)), -1)
  const indice = Math.max(indiceMerecido(stats, exigirRecrutas), maiorJaTida, 0)

  const jaTem = new Set(tenho.map((t) => t.patente as Patente))
  const faltantes = ESCADA.slice(0, indice + 1).filter((d) => !jaTem.has(d.patente))
  if (faltantes.length > 0) {
    await prisma.patenteConquistada.createMany({ data: faltantes.map((d) => ({ userId, patente: d.patente })), skipDuplicates: true })
  }

  const agora = new Date()
  const conquistadas = [
    ...tenho.map((t) => ({ patente: t.patente as Patente, conquistadoEm: t.conquistadoEm })),
    ...faltantes.map((d) => ({ patente: d.patente, conquistadoEm: agora })),
  ]

  return {
    atual: ESCADA[indice],
    indice,
    stats,
    progresso: progressoParaProxima(stats, indice, exigirRecrutas),
    novas: faltantes,
    conquistadas,
  }
}

/** Patente atual de vários usuários de uma vez (para mostrar no ranking). Quem ainda não foi sincronizado conta como Recruta. */
export async function patentesDe(userIds: string[]): Promise<Record<string, Patente>> {
  if (userIds.length === 0) return {}
  const linhas = await prisma.patenteConquistada.findMany({ where: { userId: { in: userIds } }, select: { userId: true, patente: true } })

  const mapa: Record<string, Patente> = Object.fromEntries(userIds.map((id) => [id, "RECRUTA" as Patente]))
  for (const l of linhas) {
    if (indiceDaPatente(l.patente as Patente) > indiceDaPatente(mapa[l.userId])) mapa[l.userId] = l.patente as Patente
  }
  return mapa
}
