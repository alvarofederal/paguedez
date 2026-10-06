import { z } from "zod"

export const quantidadeSchema = z.coerce
  .number({ invalid_type_error: "Informe um número" })
  .int("Só números inteiros")
  .min(1, "Pague pelo menos uma!")
  // Acima do teto o servidor responde com a mensagem amigável de avaliarLimites
  .max(100_000, "Número inválido")

export const novoUsuarioSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(80),
  email: z.string().trim().toLowerCase().email("Email inválido").max(255),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres").max(128),
  sexo: z.enum(["MASCULINO", "FEMININO"], { message: "Escolha uma opção" }),
})

export type NovoUsuario = z.infer<typeof novoUsuarioSchema>
