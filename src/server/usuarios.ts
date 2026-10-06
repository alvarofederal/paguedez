import "server-only"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import type { NovoUsuario } from "@/lib/validators"

export async function criarUsuario(dados: NovoUsuario, papel?: "ADMIN" | "USUARIO") {
  const existente = await prisma.user.findUnique({ where: { email: dados.email } })
  if (existente) return { erro: "Já existe um usuário com este email" }

  // O primeiro cadastro do sistema vira ADMIN automaticamente
  const papelFinal = papel ?? ((await prisma.user.count()) === 0 ? "ADMIN" : "USUARIO")

  const user = await prisma.user.create({
    data: {
      name: dados.name,
      email: dados.email,
      sexo: dados.sexo,
      papel: papelFinal,
      password: await bcrypt.hash(dados.password, 10),
    },
    select: { id: true },
  })
  return { erro: null, id: user.id }
}

export function listarUsuarios() {
  return prisma.user.findMany({
    orderBy: { criadoEm: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      sexo: true,
      papel: true,
      ativo: true,
      criadoEm: true,
      _count: { select: { registros: true, tacas: true } },
    },
  })
}
