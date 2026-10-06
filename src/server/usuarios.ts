import "server-only"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { papelPorEmail } from "@/lib/admin"
import { LIMITES } from "@/lib/limites"
import type { NovoUsuario } from "@/lib/validators"

export async function criarUsuario(dados: NovoUsuario) {
  const existente = await prisma.user.findUnique({ where: { email: dados.email } })
  if (existente) return { erro: "Já existe um usuário com este email" }

  const user = await prisma.user.create({
    data: {
      name: dados.name,
      email: dados.email,
      sexo: dados.sexo,
      papel: papelPorEmail(dados.email), // só o email do dono vira ADMIN
      password: await bcrypt.hash(dados.password, 10),
    },
    select: { id: true },
  })
  return { erro: null, id: user.id }
}

export async function listarUsuarios() {
  const usuarios = await prisma.user.findMany({
    orderBy: { criadoEm: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      sexo: true,
      ativo: true,
      criadoEm: true,
      _count: { select: { registros: true, tacas: true } },
    },
  })
  // Maior série de cada um: série acima do limite de "tem certeza?" é sinal de sacanagem
  const maiores = await prisma.registro.groupBy({ by: ["userId"], _max: { quantidade: true } })
  const maiorPorUsuario = new Map(maiores.map((m) => [m.userId, m._max.quantidade ?? 0]))

  return usuarios.map((u) => {
    const maiorSerie = maiorPorUsuario.get(u.id) ?? 0
    return { ...u, papel: papelPorEmail(u.email), maiorSerie, suspeito: maiorSerie > LIMITES.confirmarAcima }
  })
}
