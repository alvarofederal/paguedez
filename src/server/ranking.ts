import "server-only"
import prisma from "@/lib/prisma"
import { diaBrasilia, limitesDoPeriodo, type TipoPeriodo } from "@/lib/periodos"
import { ordenarRanking, type LinhaRanking } from "@/lib/ranking"

/**
 * Ranking do grupo no período. Só LÊ os registros que já existem (somente leitura);
 * quem não pagou nada aparece com 0. Contas desativadas ficam de fora.
 */
export async function rankingDe(userIds: string[], tipo: TipoPeriodo, agora = new Date()): Promise<LinhaRanking[]> {
  if (userIds.length === 0) return []
  const { de, ate } = limitesDoPeriodo(tipo, diaBrasilia(agora))

  const [usuarios, somas] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: userIds }, ativo: true }, select: { id: true, name: true } }),
    prisma.registro.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, dia: { gte: de, lte: ate } },
      _sum: { quantidade: true },
      _max: { feitoEm: true },
    }),
  ])
  const porUsuario = new Map(somas.map((s) => [s.userId, s]))

  return ordenarRanking(
    usuarios.map((u) => {
      const s = porUsuario.get(u.id)
      return { userId: u.id, name: u.name, total: s?._sum.quantidade ?? 0, ultimoEm: s?._max.feitoEm ?? null }
    })
  )
}
