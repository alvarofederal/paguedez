// Regras puras dos lembretes (push): quando um lembrete deve disparar e o que a mensagem diz.
// Todos os horários são de Brasília (America/Sao_Paulo), como o resto do app.

export const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const
/** Máscara com todos os dias: bit 0 = segunda ... bit 6 = domingo. */
export const TODOS_OS_DIAS = 127

const OFFSET_BRASILIA_MS = -3 * 60 * 60 * 1000

export function horaValida(hora: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(hora)
}

export function minutosDeHora(hora: string): number {
  const [h, m] = hora.split(":").map(Number)
  return h * 60 + m
}

export function temDia(mascara: number, indice: number): boolean {
  return (mascara & (1 << indice)) !== 0
}

export function alternarDia(mascara: number, indice: number): number {
  return mascara ^ (1 << indice)
}

export function mascaraValida(mascara: number): boolean {
  return Number.isInteger(mascara) && mascara >= 1 && mascara <= TODOS_OS_DIAS
}

/** 0 = segunda ... 6 = domingo, para um dia "YYYY-MM-DD". */
export function indiceDiaSemana(dia: string): number {
  const dow = new Date(`${dia}T00:00:00Z`).getUTCDay() // 0 = domingo
  return (dow + 6) % 7
}

export type AgoraBrasilia = { dia: string; minutos: number }

export function agoraEmBrasilia(agora: Date): AgoraBrasilia {
  const deslocada = new Date(agora.getTime() + OFFSET_BRASILIA_MS)
  return { dia: deslocada.toISOString().slice(0, 10), minutos: deslocada.getUTCHours() * 60 + deslocada.getUTCMinutes() }
}

export type LembreteConfig = { hora: string; diasSemana: number; somenteSePendente: boolean; ativo: boolean }

export type DecisaoLembrete = "ENVIAR" | "INATIVO" | "FORA_DO_DIA" | "AINDA_NAO" | "PERDEU_JANELA" | "JA_PROCESSADO" | "JA_PAGOU"

/** Filtro barato (sem banco): o lembrete está na janela de disparo agora? */
export function naJanela(l: LembreteConfig, agora: AgoraBrasilia, toleranciaMin: number): "SIM" | Exclude<DecisaoLembrete, "ENVIAR" | "JA_PROCESSADO" | "JA_PAGOU"> {
  if (!l.ativo) return "INATIVO"
  if (!temDia(l.diasSemana, indiceDiaSemana(agora.dia))) return "FORA_DO_DIA"
  const atraso = agora.minutos - minutosDeHora(l.hora)
  if (atraso < 0) return "AINDA_NAO"
  // A janela termina em `toleranciaMin` (ou à meia-noite): se o agendador ficou fora do ar, não manda um lembrete das 7h às 22h.
  if (atraso > toleranciaMin) return "PERDEU_JANELA"
  return "SIM"
}

export function avaliarLembrete(
  l: LembreteConfig,
  agora: AgoraBrasilia,
  contexto: { jaProcessadoHoje: boolean; jaPagouHoje: boolean },
  toleranciaMin: number
): DecisaoLembrete {
  const janela = naJanela(l, agora, toleranciaMin)
  if (janela !== "SIM") return janela
  if (contexto.jaProcessadoHoje) return "JA_PROCESSADO"
  if (l.somenteSePendente && contexto.jaPagouHoje) return "JA_PAGOU"
  return "ENVIAR"
}

export type PayloadPush = { titulo: string; corpo: string; url: string; tag: string }

const SEM_FLECAS = [
  "Você ainda não pagou nenhuma fleca hoje. Que tal dez agora?",
  "O sargento está esperando: pague dez e registre no app.",
  "Hora de pagar suas flecas. Leva menos de um minuto.",
]

/** Texto do lembrete. `semente` (ex.: dia do ano) varia a frase sem ser aleatório, para ser testável. */
export function montarMensagem(c: { totalHoje: number; recordeDiario: number; tratamento?: string; semente: number }): PayloadPush {
  const prefixo = c.tratamento ? `${c.tratamento}, ` : ""
  let corpo: string

  if (c.totalHoje === 0) {
    const frase = SEM_FLECAS[Math.abs(c.semente) % SEM_FLECAS.length]
    // Com prefixo a frase começa em minúscula ("Cabo, você ainda não...")
    corpo = c.tratamento ? `${prefixo}${frase.charAt(0).toLowerCase()}${frase.slice(1)}` : frase
  } else if (c.recordeDiario > c.totalHoje) {
    corpo = `${prefixo}hoje você já pagou ${c.totalHoje}. Faltam ${c.recordeDiario - c.totalHoje + 1} para bater o seu recorde diário.`
  } else {
    corpo = `${prefixo}hoje você já pagou ${c.totalHoje}. Quer ir além?`
  }

  // Frase com prefixo no começo da mensagem precisa de inicial maiúscula
  corpo = corpo.charAt(0).toUpperCase() + corpo.slice(1)
  return { titulo: "Pague Dez", corpo, url: "/", tag: "lembrete-pague-dez" }
}

/** "07:00, 19:30" → útil para resumir a agenda na tela. */
export function ordenarPorHora<T extends { hora: string }>(itens: T[]): T[] {
  return [...itens].sort((a, b) => minutosDeHora(a.hora) - minutosDeHora(b.hora))
}
