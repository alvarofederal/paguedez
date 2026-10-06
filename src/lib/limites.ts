// Travas anti-sacanagem do botão PAGUEI!. Regras puras (sem banco) para serem testadas.
// Ajuste os números aqui — é o único lugar onde eles vivem.

export const LIMITES = {
  /** Espaço mínimo entre dois registros (segura duplo clique e metralhadora). */
  intervaloMinimoSeg: 15,
  /** No máximo N registros dentro de uma janela deslizante (ex.: 2 a cada 3 minutos). */
  maxRegistrosNaJanela: 2,
  janelaSeg: 180,
  /** Teto de uma única série. Acima de `confirmarAcima` o app pergunta "tem certeza?". */
  maxPorSerie: 200,
  confirmarAcima: 100,
  /** Tetos do dia (horário de Brasília). */
  maxRegistrosDia: 20,
  maxFlecasDia: 1000,
} as const

export type RegistroRecente = { quantidade: number; feitoEm: Date }

export type ResultadoLimite =
  | { ok: true }
  | { ok: false; motivo: "INTERVALO" | "JANELA" | "SERIE_GRANDE" | "LIMITE_DIA"; mensagem: string; esperarSegundos?: number }

const segundosEntre = (maior: Date, menor: Date) => (maior.getTime() - menor.getTime()) / 1000

/**
 * @param registrosHoje registros do usuário no dia atual (qualquer ordem)
 */
export function avaliarLimites(quantidade: number, registrosHoje: RegistroRecente[], agora: Date): ResultadoLimite {
  if (quantidade > LIMITES.maxPorSerie) {
    return {
      ok: false,
      motivo: "SERIE_GRANDE",
      mensagem: `Uma série de ${quantidade}? O máximo por registro é ${LIMITES.maxPorSerie}. Divida em séries menores.`,
    }
  }

  const recentes = [...registrosHoje].sort((a, b) => b.feitoEm.getTime() - a.feitoEm.getTime())

  // 1) Intervalo mínimo desde o último registro
  if (recentes.length > 0) {
    const espera = Math.ceil(LIMITES.intervaloMinimoSeg - segundosEntre(agora, recentes[0].feitoEm))
    if (espera > 0) {
      return { ok: false, motivo: "INTERVALO", esperarSegundos: espera, mensagem: `Calma, soldado! Aguarde ${espera}s para o próximo registro.` }
    }
  }

  // 2) Rajada: N registros dentro da janela deslizante
  const naJanela = recentes.filter((r) => segundosEntre(agora, r.feitoEm) < LIMITES.janelaSeg)
  if (naJanela.length >= LIMITES.maxRegistrosNaJanela) {
    // Libera quando o registro mais antigo que ainda conta sair da janela
    const maisAntigo = naJanela[LIMITES.maxRegistrosNaJanela - 1]
    const espera = Math.ceil(LIMITES.janelaSeg - segundosEntre(agora, maisAntigo.feitoEm))
    return {
      ok: false,
      motivo: "JANELA",
      esperarSegundos: espera,
      mensagem: `Muitos registros seguidos! Descanse e volte em ${formatarEspera(espera)}.`,
    }
  }

  // 3) Tetos do dia
  const totalHoje = recentes.reduce((soma, r) => soma + r.quantidade, 0)
  if (recentes.length >= LIMITES.maxRegistrosDia || totalHoje + quantidade > LIMITES.maxFlecasDia) {
    return {
      ok: false,
      motivo: "LIMITE_DIA",
      mensagem: "Limite diário atingido. Descanse, guerreiro — amanhã tem mais!",
    }
  }

  return { ok: true }
}

export function formatarEspera(segundos: number): string {
  if (segundos < 60) return `${segundos}s`
  const min = Math.floor(segundos / 60)
  const resto = segundos % 60
  return resto === 0 ? `${min}min` : `${min}min ${resto}s`
}
