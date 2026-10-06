import { chavePeriodo, TIPOS_PERIODO, type TipoPeriodo } from "./periodos"

// Regras puras de recorde — sem banco, para serem testadas isoladamente.
// Recorde = maior TOTAL somado no período (não a maior série isolada).

export type TotalDia = { dia: string; quantidade: number }

export type AvaliacaoPeriodo = {
  tipo: TipoPeriodo
  periodo: string
  total: number
  melhorAnterior: number | null // null = não há período anterior para bater
  bateu: boolean
}

export type ResumoPeriodo = {
  tipo: TipoPeriodo
  atual: number
  recorde: number
  periodoRecorde: string | null
}

export function totaisPorPeriodo(dias: TotalDia[], tipo: TipoPeriodo): Map<string, number> {
  const totais = new Map<string, number>()
  for (const { dia, quantidade } of dias) {
    const chave = chavePeriodo(tipo, dia)
    totais.set(chave, (totais.get(chave) ?? 0) + quantidade)
  }
  return totais
}

// Compara o período atual com os anteriores. Só há recorde se existir período anterior
// e o total atual for ESTRITAMENTE maior que o melhor deles.
export function avaliarRecordes(dias: TotalDia[], diaAtual: string): AvaliacaoPeriodo[] {
  return TIPOS_PERIODO.map((tipo) => {
    const totais = totaisPorPeriodo(dias, tipo)
    const periodo = chavePeriodo(tipo, diaAtual)
    const total = totais.get(periodo) ?? 0

    let melhorAnterior: number | null = null
    for (const [chave, valor] of totais) {
      if (chave === periodo) continue
      melhorAnterior = Math.max(melhorAnterior ?? 0, valor)
    }

    return {
      tipo,
      periodo,
      total,
      melhorAnterior,
      bateu: melhorAnterior !== null && total > melhorAnterior,
    }
  })
}

export function resumirPeriodos(dias: TotalDia[], diaAtual: string): ResumoPeriodo[] {
  return TIPOS_PERIODO.map((tipo) => {
    const totais = totaisPorPeriodo(dias, tipo)
    let recorde = 0
    let periodoRecorde: string | null = null
    for (const [chave, valor] of totais) {
      if (valor > recorde) {
        recorde = valor
        periodoRecorde = chave
      }
    }
    return {
      tipo,
      atual: totais.get(chavePeriodo(tipo, diaAtual)) ?? 0,
      recorde,
      periodoRecorde,
    }
  })
}
