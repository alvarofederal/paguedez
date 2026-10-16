// Regras puras dos convites: cotas, validade, mensagem e link do WhatsApp.
import { LIMITES_SOCIAL } from "./planos"

export type StatusConvite = "PENDENTE" | "ACEITO" | "EXPIRADO" | "CANCELADO"

/** Um convite pendente cuja validade passou vale como expirado. */
export function statusEfetivo(status: StatusConvite, expiraEm: Date, agora: Date): StatusConvite {
  return status === "PENDENTE" && expiraEm.getTime() <= agora.getTime() ? "EXPIRADO" : status
}

export function dataDeExpiracao(agora: Date): Date {
  return new Date(agora.getTime() + LIMITES_SOCIAL.conviteValidadeDias * 24 * 60 * 60 * 1000)
}

export type SituacaoCota = {
  /** amigos já conectados */
  amigos: number
  /** convites pendentes e ainda válidos */
  pendentes: number
  /** convites criados nas últimas 24h */
  criadosUltimas24h: number
  /** null = ilimitado (cobrança desligada ou plano pago) */
  limiteAmigos: number | null
}

export type ResultadoCota = { ok: true } | { ok: false; motivo: "PENDENTES" | "DIA" | "PLANO"; mensagem: string }

export function avaliarCriacaoConvite(c: SituacaoCota): ResultadoCota {
  if (c.criadosUltimas24h >= LIMITES_SOCIAL.convitesPorDia) {
    return { ok: false, motivo: "DIA", mensagem: `Limite de ${LIMITES_SOCIAL.convitesPorDia} convites por dia. Volte amanhã, recrutador!` }
  }
  if (c.pendentes >= LIMITES_SOCIAL.convitesPendentes) {
    return {
      ok: false,
      motivo: "PENDENTES",
      mensagem: `Você já tem ${LIMITES_SOCIAL.convitesPendentes} convites aguardando resposta. Espere os amigos aceitarem ou cancele algum.`,
    }
  }
  // Pendentes ocupam vaga, senão dava para furar o limite mandando vários convites de uma vez
  if (c.limiteAmigos !== null && c.amigos + c.pendentes >= c.limiteAmigos) {
    return { ok: false, motivo: "PLANO", mensagem: `O plano grátis permite ${c.limiteAmigos} amigos. Para convidar mais, vire Oficial.` }
  }
  return { ok: true }
}

export const MODELOS_MENSAGEM = [
  (apelido: string, quem: string) => `Soldado ${apelido}! O sargento ${quem} mandou você pagar dez 💪 Aceita o desafio?`,
  (apelido: string, quem: string) => `${apelido}, bati meu recorde de flexões no Pague Dez. Quero ver você me alcançar! — ${quem}`,
  (apelido: string, quem: string) => `Atenção ${apelido}! Você foi convocado por ${quem} para a tropa do Pague Dez. Apresente-se!`,
]

export function mensagemPadrao(apelido: string, quemConvida: string, pelotao?: string): string {
  if (pelotao) return `Soldado ${apelido}! ${quemConvida} convocou você para o pelotão "${pelotao}" no Pague Dez 🫡 Apresente-se!`
  return MODELOS_MENSAGEM[0](apelido, quemConvida)
}

/** Sem número, o WhatsApp abre a lista de contatos para escolher (usado em "reenviar"). */
export function urlWhatsapp(texto: string, numero?: string): string {
  return `https://wa.me/${numero ?? ""}?text=${encodeURIComponent(texto)}`
}

const LINK_NO_FINAL = /\s*https?:\/\/\S+\/convite\/[A-Za-z0-9_-]+\s*$/

/** Tira um link de convite que já esteja no final do texto (ex.: o de um envio anterior, que deixou de valer). */
export function removerLinkDeConvite(texto: string): string {
  return texto.replace(LINK_NO_FINAL, "").trim()
}

/** Mensagem + link do convite (uma linha abaixo). É o texto que vai ao WhatsApp e que o usuário pode copiar. */
export function textoFinal(mensagem: string, link: string): string {
  return `${removerLinkDeConvite(mensagem)}\n${link}`
}
