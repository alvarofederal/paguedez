// Ranking entre amigos e pelotões. Critério: soma de flecas no período.
// Empate: quem completou o total primeiro (último registro mais antigo) fica na frente.

export type EntradaRanking = {
  userId: string
  name: string
  total: number
  ultimoEm: Date | null
}

export type LinhaRanking = EntradaRanking & { posicao: number }

export function ordenarRanking(entradas: EntradaRanking[]): LinhaRanking[] {
  return [...entradas]
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total
      const ta = a.ultimoEm?.getTime() ?? Number.POSITIVE_INFINITY
      const tb = b.ultimoEm?.getTime() ?? Number.POSITIVE_INFINITY
      if (ta !== tb) return ta - tb
      return a.name.localeCompare(b.name, "pt-BR")
    })
    .map((e, i) => ({ ...e, posicao: i + 1 }))
}

/** Quantas flecas faltam para passar quem está logo à frente (null = já é o líder ou ninguém pagou). */
export function faltamParaPassar(linhas: LinhaRanking[], userId: string): { nome: string; faltam: number } | null {
  const eu = linhas.find((l) => l.userId === userId)
  if (!eu || eu.posicao === 1) return null
  const acima = linhas[eu.posicao - 2]
  if (acima.total === 0) return null
  return { nome: acima.name, faltam: acima.total - eu.total + 1 }
}
