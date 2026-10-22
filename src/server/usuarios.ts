import "server-only"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { EMAIL_ADMIN, papelPorEmail } from "@/lib/admin"
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

/**
 * Exclui um perfil DEFINITIVAMENTE, com tudo o que for dele (séries, taças, emblemas, patentes, amizades, convocações,
 * convites enviados e pelotões que comandava). Pensado para limpar quem entrou só por curiosidade.
 * Travas: o administrador nunca pode ser excluído e perfil COM séries registradas precisa estar desativado antes
 * (dois passos de propósito — apagar não tem volta).
 */
export async function excluirUsuario(alvoId: string): Promise<{ erro: string | null }> {
  const alvo = await prisma.user.findUnique({ where: { id: alvoId }, select: { id: true, email: true, ativo: true } })
  if (!alvo) return { erro: "Usuário não encontrado" }
  if (alvo.email === EMAIL_ADMIN) return { erro: "O administrador não pode ser excluído" }

  const registros = await prisma.registro.count({ where: { userId: alvoId } })
  if (registros > 0 && alvo.ativo) {
    return { erro: "Este perfil já registrou flecas. Desative-o primeiro; só então a expulsão é liberada." }
  }

  await prisma.$transaction(
    async (tx) => {
      // pelotões que ele comandava somem por inteiro (membros, convocações e convites pendentes deles)
      const comandados = (await tx.comunidade.findMany({ where: { donoId: alvoId }, select: { id: true } })).map((c) => c.id)
      if (comandados.length > 0) {
        await tx.convocacao.deleteMany({ where: { comunidadeId: { in: comandados } } })
        await tx.membroComunidade.deleteMany({ where: { comunidadeId: { in: comandados } } })
        await tx.convite.deleteMany({ where: { comunidadeId: { in: comandados } } })
        await tx.comunidade.deleteMany({ where: { id: { in: comandados } } })
      }

      await tx.convocacao.deleteMany({ where: { OR: [{ convidadoId: alvoId }, { convidanteId: alvoId }] } })
      await tx.membroComunidade.deleteMany({ where: { userId: alvoId } })
      await tx.amizade.deleteMany({ where: { OR: [{ usuarioAId: alvoId }, { usuarioBId: alvoId }] } })
      await tx.convite.deleteMany({ where: { convidanteId: alvoId } })
      // convites que ele aceitou continuam existindo para quem convidou, só sem ligação com a conta apagada
      await tx.convite.updateMany({ where: { aceitoPorId: alvoId }, data: { aceitoPorId: null } })
      const lembretes = (await tx.lembrete.findMany({ where: { userId: alvoId }, select: { id: true } })).map((l) => l.id)
      await tx.lembreteEnvio.deleteMany({ where: { lembreteId: { in: lembretes } } })
      await tx.lembrete.deleteMany({ where: { userId: alvoId } })
      await tx.pushInscricao.deleteMany({ where: { userId: alvoId } })
      await tx.patenteConquistada.deleteMany({ where: { userId: alvoId } })
      await tx.emblema.deleteMany({ where: { userId: alvoId } })
      await tx.taca.deleteMany({ where: { userId: alvoId } })
      await tx.registro.deleteMany({ where: { userId: alvoId } })
      await tx.user.delete({ where: { id: alvoId } })
    },
    { timeout: 20_000, maxWait: 10_000 }
  )
  return { erro: null }
}
