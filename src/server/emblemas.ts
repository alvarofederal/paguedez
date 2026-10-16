import "server-only"
import prisma from "@/lib/prisma"
import { CATALOGO_EMBLEMAS, emblemasMerecidos, type EstatisticasEmblemas, type TipoEmblema } from "@/lib/emblemas"

async function estatisticas(userId: string): Promise<EstatisticasEmblemas> {
  const [taca, convitesAceitos, comunidadesCriadas, dias, soma] = await Promise.all([
    prisma.taca.count({ where: { userId, tipo: "PRIMEIRA" } }),
    prisma.convite.count({ where: { convidanteId: userId, status: "ACEITO" } }),
    prisma.comunidade.count({ where: { donoId: userId } }),
    prisma.registro.groupBy({ by: ["dia"], where: { userId } }),
    prisma.registro.aggregate({ where: { userId }, _sum: { quantidade: true } }),
  ])
  return {
    temTacaRecruta: taca > 0,
    convitesAceitos,
    comunidadesCriadas,
    diasComFlecas: dias.length,
    totalFlecas: soma._sum.quantidade ?? 0,
  }
}

/** Concede os emblemas merecidos que ainda não existem. Idempotente; emblema conquistado nunca é retirado. */
export async function sincronizarEmblemas(userId: string): Promise<TipoEmblema[]> {
  const stats = await estatisticas(userId)
  const merecidos = emblemasMerecidos(stats)
  const tenho = await prisma.emblema.findMany({ where: { userId }, select: { tipo: true } })
  const novos = merecidos.filter((t) => !tenho.some((e) => e.tipo === t))
  if (novos.length > 0) {
    await prisma.emblema.createMany({ data: novos.map((tipo) => ({ userId, tipo })), skipDuplicates: true })
  }
  return novos
}

/** Versão para eventos (aceitar convite, criar pelotão): emblema é bônus, nunca pode derrubar a ação principal. */
export async function sincronizarEmblemasSemErro(userId: string): Promise<void> {
  try {
    await sincronizarEmblemas(userId)
  } catch (erro) {
    console.error("Falha ao sincronizar emblemas (será refeito ao abrir a página de emblemas):", erro)
  }
}

export async function listarEmblemas(userId: string) {
  await sincronizarEmblemas(userId)
  const [stats, conquistados] = await Promise.all([
    estatisticas(userId),
    prisma.emblema.findMany({ where: { userId }, select: { tipo: true, conquistadoEm: true } }),
  ])
  const quando = new Map(conquistados.map((e) => [e.tipo as TipoEmblema, e.conquistadoEm]))

  return {
    stats,
    emblemas: CATALOGO_EMBLEMAS.map(({ merecido: _merecido, ...def }) => ({ ...def, conquistadoEm: quando.get(def.tipo) ?? null })),
  }
}
