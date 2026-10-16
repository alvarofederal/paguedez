import "server-only"
import prisma from "@/lib/prisma"
import { parOrdenado } from "@/lib/amizade"
import type { NivelVisibilidade } from "@/lib/visibilidade"

export type Amigo = {
  userId: string
  name: string
  sexo: "MASCULINO" | "FEMININO"
  desde: Date
  /** o que EU mostro para ele */
  euMostro: number
  /** o que ELE mostra para mim */
  elesMostram: number
}

export async function listarAmigos(userId: string): Promise<Amigo[]> {
  const amizades = await prisma.amizade.findMany({
    where: { OR: [{ usuarioAId: userId }, { usuarioBId: userId }] },
    orderBy: { criadoEm: "desc" },
  })
  if (amizades.length === 0) return []

  const ids = amizades.map((a) => (a.usuarioAId === userId ? a.usuarioBId : a.usuarioAId))
  const usuarios = await prisma.user.findMany({
    where: { id: { in: ids }, ativo: true },
    select: { id: true, name: true, sexo: true },
  })
  const porId = new Map(usuarios.map((u) => [u.id, u]))

  return amizades.flatMap((a) => {
    const souA = a.usuarioAId === userId
    const outro = porId.get(souA ? a.usuarioBId : a.usuarioAId)
    if (!outro) return [] // conta desativada some da lista
    return [
      {
        userId: outro.id,
        name: outro.name,
        sexo: outro.sexo,
        desde: a.criadoEm,
        euMostro: souA ? a.aMostra : a.bMostra,
        elesMostram: souA ? a.bMostra : a.aMostra,
      },
    ]
  })
}

/** Nível que `alvo` mostra para `observador`; null se não são amigos. */
export async function nivelQueAmigoMostra(observadorId: string, alvoId: string): Promise<number | null> {
  const [a, b] = parOrdenado(observadorId, alvoId)
  const amizade = await prisma.amizade.findUnique({ where: { usuarioAId_usuarioBId: { usuarioAId: a, usuarioBId: b } } })
  if (!amizade) return null
  return alvoId === amizade.usuarioAId ? amizade.aMostra : amizade.bMostra
}

export async function definirMinhaVisibilidade(userId: string, amigoId: string, nivel: NivelVisibilidade) {
  const [a, b] = parOrdenado(userId, amigoId)
  const amizade = await prisma.amizade.findUnique({ where: { usuarioAId_usuarioBId: { usuarioAId: a, usuarioBId: b } } })
  if (!amizade) return { erro: "Amizade não encontrada" }

  await prisma.amizade.update({
    where: { id: amizade.id },
    data: userId === amizade.usuarioAId ? { aMostra: nivel } : { bMostra: nivel },
  })
  return { erro: null }
}

export async function desfazerAmizade(userId: string, amigoId: string) {
  const [a, b] = parOrdenado(userId, amigoId)
  const { count } = await prisma.amizade.deleteMany({ where: { usuarioAId: a, usuarioBId: b } })
  return count > 0 ? { erro: null } : { erro: "Amizade não encontrada" }
}
