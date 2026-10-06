"use server"

import { revalidatePath } from "next/cache"
import { usuarioAtual } from "@/lib/auth"
import { quantidadeSchema } from "@/lib/validators"
import { excluirSerie, registrarSerie } from "@/server/flexoes"

export async function pagarFlecas(quantidade: number) {
  const user = await usuarioAtual()
  if (!user) return { erro: "Sessão expirada. Entre novamente." } as const

  const dados = quantidadeSchema.safeParse(quantidade)
  if (!dados.success) return { erro: dados.error.issues[0].message } as const

  const resultado = await registrarSerie(user.id, dados.data)
  revalidatePath("/")
  revalidatePath("/historico")
  return { erro: null, ...resultado } as const
}

export async function apagarSerie(registroId: string) {
  const user = await usuarioAtual()
  if (!user) return { erro: "Sessão expirada. Entre novamente." }

  const resultado = await excluirSerie(user.id, registroId)
  revalidatePath("/")
  revalidatePath("/historico")
  return resultado
}
