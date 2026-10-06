// Só existe UM administrador no Pague Dez, definido pelo email (decisão do dono do produto).
// O papel é sempre derivado daqui — a coluna `papel` no banco é só um espelho, nunca a fonte da verdade.
export const EMAIL_ADMIN = "alvarofederal@gmail.com"

export function papelPorEmail(email: string): "ADMIN" | "USUARIO" {
  return email.trim().toLowerCase() === EMAIL_ADMIN ? "ADMIN" : "USUARIO"
}
