"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { usuarioAtual } from "@/lib/auth"
import { EMAIL_ADMIN } from "@/lib/admin"
import { novoUsuarioSchema, type NovoUsuario } from "@/lib/validators"
import { criarUsuario } from "@/server/usuarios"

// Cadastro público (tela /cadastro). O login é feito no cliente logo em seguida.
export async function cadastrar(dados: NovoUsuario) {
  const valido = novoUsuarioSchema.safeParse(dados)
  if (!valido.success) return { erro: valido.error.issues[0].message }
  return criarUsuario(valido.data)
}

async function exigirAdmin() {
  const user = await usuarioAtual()
  return user?.papel === "ADMIN" ? user : null
}

export async function adminCriarUsuario(dados: NovoUsuario) {
  if (!(await exigirAdmin())) return { erro: "Acesso negado" }

  const valido = novoUsuarioSchema.safeParse(dados)
  if (!valido.success) return { erro: valido.error.issues[0].message }

  const resultado = await criarUsuario(valido.data)
  revalidatePath("/admin/usuarios")
  return resultado
}

export async function adminAlternarAtivo(userId: string) {
  if (!(await exigirAdmin())) return { erro: "Acesso negado" }

  const alvo = await prisma.user.findUnique({ where: { id: userId }, select: { ativo: true, email: true } })
  if (!alvo) return { erro: "Usuário não encontrado" }
  if (alvo.email === EMAIL_ADMIN) return { erro: "O administrador não pode ser desativado" }

  await prisma.user.update({ where: { id: userId }, data: { ativo: !alvo.ativo } })
  revalidatePath("/admin/usuarios")
  return { erro: null }
}
