// Limites do social e preparação para planos pagos.
// Decisão do dono (2026-10-16): construir tudo liberado e definir depois o que é pago.
// Por isso `COBRANCA_ATIVA` começa DESLIGADA: sem cobrança, o limite de amigos não vale.
// Quando ligar (COBRANCA_ATIVA=true), o plano grátis passa a ter `amigosGratis` amigos.

export type Plano = "GRATIS" | "OFICIAL"

export const COBRANCA_ATIVA = process.env.COBRANCA_ATIVA === "true"

export const LIMITES_SOCIAL = {
  /** Só vale com cobrança ativa e plano grátis. */
  amigosGratis: 3,
  /** Anti-spam — sempre valem, independente de plano. */
  convitesPendentes: 5,
  convitesPorDia: 10,
  conviteValidadeDias: 7,
  comunidadesPorUsuario: 5,
  membrosPorComunidade: 100,
} as const

/** Máximo de amigos conectados do plano; null = ilimitado. */
export function limiteDeAmigos(plano: Plano = "GRATIS", cobrancaAtiva: boolean = COBRANCA_ATIVA): number | null {
  if (!cobrancaAtiva || plano === "OFICIAL") return null
  return LIMITES_SOCIAL.amigosGratis
}

/**
 * Lembretes (push). Hoje liberados para todos. Quando houver cobrança, a ideia é o grátis ter 1 lembrete e o plano
 * pago a agenda completa — mude só `porUsuario` (e uma função como `limiteDeAmigos`) para fazer essa separação.
 */
export const LIMITES_LEMBRETES = {
  porUsuario: 10,
  /** Janela, em minutos, depois do horário marcado em que o lembrete ainda vale (cobre atraso do agendador). */
  toleranciaMinutos: 120,
  intervaloTesteSeg: 15,
} as const
