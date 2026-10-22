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

// ── Social ──────────────────────────────────────────────────────────────

export const nivelSchema = z.union([z.literal(0), z.literal(1), z.literal(2)], { message: "Nível de visibilidade inválido" })

export const conviteSchema = z.object({
  apelido: z.string().trim().min(2, "Dê um apelido ao seu amigo").max(40, "Apelido muito longo"),
  telefone: z.string().trim().min(8, "Informe o WhatsApp do amigo").max(30, "Número inválido"),
  mensagem: z.string().trim().max(240, "Mensagem muito longa (máx. 240)").optional(),
  comunidadeId: z.string().trim().max(40).nullish(),
})

export const comunidadeSchema = z.object({
  nome: z.string().trim().min(3, "O nome do pelotão precisa de ao menos 3 letras").max(40, "Nome muito longo"),
  descricao: z.string().trim().max(140, "Descrição muito longa (máx. 140)").optional(),
  cor: z.enum(["eletrico", "menta", "lavanda", "brasa", "sol", "violeta", "chiclete"], { message: "Escolha uma cor" }),
  nivelVisibilidade: nivelSchema,
})

export const idSchema = z.string().trim().min(1).max(64)
export const tokenSchema = z.string().trim().regex(/^[A-Za-z0-9_-]{6,64}$/, "Link inválido")

export const inscricaoPushSchema = z.object({
  endpoint: z.string().url().startsWith("https://", "Endereço de push inválido").max(2000),
  keys: z.object({ p256dh: z.string().min(10).max(255), auth: z.string().min(10).max(255) }),
})

export const lembreteSchema = z.object({
  hora: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido"),
  diasSemana: z.number().int().min(1, "Escolha pelo menos um dia").max(127),
  somenteSePendente: z.boolean(),
})
