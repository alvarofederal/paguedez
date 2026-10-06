"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { usuarioAtual } from "@/lib/auth"
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

export async function adminCriarUsuario(dados: NovoUsuario & { papel: "ADMIN" | "USUARIO" }) {
  if (!(await exigirAdmin())) return { erro: "Acesso negado" }

  const valido = novoUsuarioSchema.safeParse(dados)
  if (!valido.success) return { erro: valido.error.issues[0].message }

  const resultado = await criarUsuario(valido.data, dados.papel === "ADMIN" ? "ADMIN" : "USUARIO")
  revalidatePath("/admin/usuarios")
  return resultado
}

export async function adminAlternarAtivo(userId: string) {
  const admin = await exigirAdmin()
  if (!admin) return { erro: "Acesso negado" }
  if (admin.id === userId) return { erro: "Você não pode desativar a si mesmo" }

  const alvo = await prisma.user.findUnique({ where: { id: userId }, select: { ativo: true } })
  if (!alvo) return { erro: "Usuário não encontrado" }

  await prisma.user.update({ where: { id: userId }, data: { ativo: !alvo.ativo } })
  revalidatePath("/admin/usuarios")
  return { erro: null }
}

export async function adminAlternarPapel(userId: string) {
  const admin = await exigirAdmin()
  if (!admin) return { erro: "Acesso negado" }
  if (admin.id === userId) return { erro: "Você não pode alterar o próprio papel" }

  const alvo = await prisma.user.findUnique({ where: { id: userId }, select: { papel: true } })
  if (!alvo) return { erro: "Usuário não encontrado" }

  await prisma.user.update({
    where: { id: userId },
    data: { papel: alvo.papel === "ADMIN" ? "USUARIO" : "ADMIN" },
  })
  revalidatePath("/admin/usuarios")
  return { erro: null }
}
