import "server-only"
import prisma from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma"
import { diaBrasilia, somarDias } from "@/lib/periodos"
import { avaliarRecordes, resumirPeriodos, type AvaliacaoPeriodo, type TotalDia } from "@/lib/recordes"
import type { TipoTaca } from "@/lib/tacas"

type Tx = Prisma.TransactionClient

export type Conquista = {
  tipo: TipoTaca
  periodo: string
  valor: number
  nivel: number
  nova: boolean // false = recorde já batido neste período, só foi ampliado
}

async function totaisPorDia(tx: Tx, userId: string): Promise<TotalDia[]> {
  const grupos = await tx.registro.groupBy({
    by: ["dia"],
    where: { userId },
    _sum: { quantidade: true },
  })
  return grupos.map((g) => ({ dia: g.dia, quantidade: g._sum.quantidade ?? 0 }))
}

async function proximoNivel(tx: Tx, userId: string): Promise<number> {
  const ultima = await tx.taca.findFirst({
    where: { userId },
    orderBy: { nivel: "desc" },
    select: { nivel: true },
  })
  return (ultima?.nivel ?? 0) + 1
}

// Mantém as taças do período atual coerentes com os totais:
// cria ao bater, amplia se aumentar no mesmo período, remove se deixou de ser recorde (exclusão).
async function sincronizarTacas(tx: Tx, userId: string, avaliacoes: AvaliacaoPeriodo[]) {
  const conquistas: Conquista[] = []

  for (const av of avaliacoes) {
    const chave = { userId_tipo_periodo: { userId, tipo: av.tipo, periodo: av.periodo } }
    const existente = await tx.taca.findUnique({ where: chave })

    if (!av.bateu) {
      if (existente) await tx.taca.delete({ where: chave })
      continue
    }

    if (existente) {
      if (existente.valor !== av.total) {
        await tx.taca.update({ where: chave, data: { valor: av.total } })
        conquistas.push({ ...av, valor: av.total, nivel: existente.nivel, nova: false })
      }
      continue
    }

    const nivel = await proximoNivel(tx, userId)
    await tx.taca.create({
      data: { userId, tipo: av.tipo, periodo: av.periodo, valor: av.total, nivel },
    })
    conquistas.push({ tipo: av.tipo, periodo: av.periodo, valor: av.total, nivel, nova: true })
  }

  return conquistas
}

export async function registrarSerie(userId: string, quantidade: number, agora = new Date()) {
  const dia = diaBrasilia(agora)

  return prisma.$transaction(
    async (tx) => {
      const registro = await tx.registro.create({ data: { userId, quantidade, dia, feitoEm: agora } })

      const conquistas: Conquista[] = []

      // Primeira flexão da vida no app vale a taça "Recruta"
      const totalRegistros = await tx.registro.count({ where: { userId } })
      if (totalRegistros === 1) {
        const nivel = await proximoNivel(tx, userId)
        await tx.taca.create({
          data: { userId, tipo: "PRIMEIRA", periodo: dia, valor: quantidade, nivel },
        })
        conquistas.push({ tipo: "PRIMEIRA", periodo: dia, valor: quantidade, nivel, nova: true })
      }

      const dias = await totaisPorDia(tx, userId)
      conquistas.push(...(await sincronizarTacas(tx, userId, avaliarRecordes(dias, dia))))

      return { registroId: registro.id, conquistas, resumo: resumirPeriodos(dias, dia) }
    },
    { timeout: 20_000 }
  )
}

// Só permite apagar séries de hoje (corrigir digitação errada) para não reescrever o passado.
export async function excluirSerie(userId: string, registroId: string, agora = new Date()) {
  const dia = diaBrasilia(agora)

  return prisma.$transaction(
    async (tx) => {
      const registro = await tx.registro.findUnique({ where: { id: registroId } })
      if (!registro || registro.userId !== userId) return { erro: "Registro não encontrado" }
      if (registro.dia !== dia) return { erro: "Só é possível apagar registros de hoje" }

      await tx.registro.delete({ where: { id: registroId } })

      const dias = await totaisPorDia(tx, userId)
      await sincronizarTacas(tx, userId, avaliarRecordes(dias, dia))
      if (dias.length === 0) await tx.taca.deleteMany({ where: { userId, tipo: "PRIMEIRA" } })

      return { erro: null }
    },
    { timeout: 20_000 }
  )
}

export async function painelDoDia(userId: string, agora = new Date()) {
  const dia = diaBrasilia(agora)
  const [dias, seriesHoje, ultimaTaca] = await Promise.all([
    totaisPorDia(prisma, userId),
    prisma.registro.findMany({
      where: { userId, dia },
      orderBy: { feitoEm: "desc" },
      select: { id: true, quantidade: true, feitoEm: true },
    }),
    prisma.taca.findFirst({ where: { userId }, orderBy: { nivel: "desc" } }),
  ])
  return { resumo: resumirPeriodos(dias, dia), seriesHoje, ultimaTaca }
}

export async function historico(userId: string, agora = new Date()) {
  const hoje = diaBrasilia(agora)
  const [dias, tacas, series] = await Promise.all([
    totaisPorDia(prisma, userId),
    prisma.taca.findMany({ where: { userId }, orderBy: { nivel: "desc" } }),
    prisma.registro.findMany({
      where: { userId },
      orderBy: { feitoEm: "desc" },
      take: 50,
      select: { id: true, quantidade: true, dia: true, feitoEm: true },
    }),
  ])

  // Últimos 30 dias, incluindo dias zerados, para o gráfico
  const porDia = new Map(dias.map((d) => [d.dia, d.quantidade]))
  const ultimos30 = Array.from({ length: 30 }, (_, i) => {
    const dia = somarDias(hoje, i - 29)
    return { dia, quantidade: porDia.get(dia) ?? 0 }
  })

  return { hoje, resumo: resumirPeriodos(dias, hoje), tacas, series, ultimos30 }
}
