// Telefone brasileiro para o link do WhatsApp (wa.me exige só dígitos, com o código do país).
// Formato aceito: (11) 99999-8888, 11999998888, +55 11 99999-8888 etc.

export type TelefoneBR = { numero: string; mascara: string }

export function normalizarTelefoneBR(entrada: string): TelefoneBR | { erro: string } {
  let digitos = entrada.replace(/\D/g, "")
  if (digitos.startsWith("00")) digitos = digitos.slice(2)

  // Remove o código do país quando veio junto (55 + 10 ou 11 dígitos)
  if (digitos.startsWith("55") && (digitos.length === 12 || digitos.length === 13)) digitos = digitos.slice(2)

  if (digitos.length !== 10 && digitos.length !== 11) {
    return { erro: "Informe o WhatsApp com DDD, ex.: (11) 99999-8888" }
  }

  const ddd = digitos.slice(0, 2)
  if (ddd[0] === "0" || ddd === "10") return { erro: "DDD inválido" }
  if (digitos.length === 11 && digitos[2] !== "9") return { erro: "Número de celular inválido (deve começar com 9 após o DDD)" }

  const final = digitos.slice(-4)
  const meio = digitos.length === 11 ? "9****" : "****"
  return { numero: `55${digitos}`, mascara: `(${ddd}) ${meio}-${final}` }
}
