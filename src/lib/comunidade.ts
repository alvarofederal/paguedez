// Aparência e utilidades das Comunidades de Pagação (pelotões).

export const CORES_COMUNIDADE = ["eletrico", "menta", "lavanda", "brasa", "sol", "violeta", "chiclete"] as const
export type CorComunidade = (typeof CORES_COMUNIDADE)[number]

export function corCss(cor: string): string {
  return (CORES_COMUNIDADE as readonly string[]).includes(cor) ? `var(--${cor})` : "var(--menta)"
}

export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome
}

/** Evita redirecionamento aberto: o "next" só pode apontar para páginas de convite/comunidade. */
export function proximoSeguro(valor: string | undefined | null): string {
  return valor && /^\/(convite|c)\/[A-Za-z0-9_-]{6,64}$/.test(valor) ? valor : "/"
}
