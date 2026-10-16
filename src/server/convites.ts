import "server-only"
import { createHash, createHmac, randomBytes } from "node:crypto"
import prisma from "@/lib/prisma"
import {
  avaliarCriacaoConvite,
  dataDeExpiracao,
  mensagemPadrao,
  statusEfetivo,
  textoFinal,
  urlWhatsapp,
  type StatusConvite,
} from "@/lib/convites"
import { parOrdenado } from "@/lib/amizade"
import { primeiroNome } from "@/lib/comunidade"
import { LIMITES_SOCIAL, limiteDeAmigos } from "@/lib/planos"
import { normalizarTelefoneBR } from "@/lib/telefone"
import type { NivelVisibilidade } from "@/lib/visibilidade"
import { sincronizarEmblemasSemErro } from "./emblemas"

const hashDoToken = (token: string) => createHash("sha256").update(token).digest("hex")
const novoToken = () => randomBytes(16).toString("base64url") // 128 bits, não adivinhável

// O telefone nunca é gravado por inteiro: só este HMAC (para barrar convite repetido) e a máscara.
function hmacDoTelefone(numero: string): string {
  const segredo = process.env.CONVITE_SECRET ?? process.env.AUTH_SECRET
  if (!segredo) throw new Error("AUTH_SECRET (ou CONVITE_SECRET) não configurado")
  return createHmac("sha256", segredo).update(`pd:tel:${numero}`).digest("hex")
}

const DIA_MS = 24 * 60 * 60 * 1000

async function travarUsuario(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], userId: string) {
  // Serializa convites do mesmo usuário (dois cliques ao mesmo tempo não furam as cotas)
  await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`
}

export type DadosConvite = {
  apelido: string
  telefone: string
  mensagem?: string
  comunidadeId?: string | null
}

export type ConviteCriado = { erro: null; conviteId: string; link: string; whatsappUrl: string; mascara: string; reenviado: boolean }

export async function criarConvite(
  convidante: { id: string; name: string },
  dados: DadosConvite,
  origem: string,
  agora = new Date()
): Promise<{ erro: string } | ConviteCriado> {
  const tel = normalizarTelefoneBR(dados.telefone)
  if ("erro" in tel) return { erro: tel.erro }

  let pelotao: { id: string; nome: string } | null = null
  if (dados.comunidadeId) {
    const membro = await prisma.membroComunidade.findUnique({
      where: { comunidadeId_userId: { comunidadeId: dados.comunidadeId, userId: convidante.id } },
    })
    const com = membro ? await prisma.comunidade.findUnique({ where: { id: dados.comunidadeId } }) : null
    if (!com) return { erro: "Pelotão não encontrado." }
    pelotao = { id: com.id, nome: com.nome }
  }

  const hmac = hmacDoTelefone(tel.numero)
  const token = novoToken()

  const resultado = await prisma.$transaction(async (tx) => {
    await travarUsuario(tx, convidante.id)

    // Mesmo amigo + mesmo pelotão ainda pendente: é um reenvio (não gasta vaga nem cota diária)
    const existente = await tx.convite.findFirst({
      where: { convidanteId: convidante.id, telefoneHmac: hmac, comunidadeId: pelotao?.id ?? null, status: "PENDENTE", expiraEm: { gt: agora } },
    })

    if (existente) {
      await tx.convite.update({
        where: { id: existente.id },
        data: { tokenHash: hashDoToken(token), expiraEm: dataDeExpiracao(agora), apelido: dados.apelido },
      })
      return { erro: null, id: existente.id, reenviado: true }
    }

    const [amigos, pendentes, criadosUltimas24h] = await Promise.all([
      tx.amizade.count({ where: { OR: [{ usuarioAId: convidante.id }, { usuarioBId: convidante.id }] } }),
      tx.convite.count({ where: { convidanteId: convidante.id, status: "PENDENTE", expiraEm: { gt: agora } } }),
      tx.convite.count({ where: { convidanteId: convidante.id, criadoEm: { gte: new Date(agora.getTime() - DIA_MS) } } }),
    ])
    const cota = avaliarCriacaoConvite({ amigos, pendentes, criadosUltimas24h, limiteAmigos: limiteDeAmigos() })
    if (!cota.ok) return { erro: cota.mensagem } as { erro: string }

    const criado = await tx.convite.create({
      data: {
        convidanteId: convidante.id,
        comunidadeId: pelotao?.id ?? null,
        apelido: dados.apelido,
        telefoneHmac: hmac,
        telefoneMascara: tel.mascara,
        tokenHash: hashDoToken(token),
        expiraEm: dataDeExpiracao(agora),
      },
    })
    return { erro: null, id: criado.id, reenviado: false }
  })

  if (resultado.erro !== null) return { erro: resultado.erro }

  const link = `${origem}/convite/${token}`
  const mensagem = dados.mensagem?.trim() || mensagemPadrao(dados.apelido, primeiroNome(convidante.name), pelotao?.nome)
  return {
    erro: null,
    conviteId: resultado.id,
    link,
    whatsappUrl: urlWhatsapp(textoFinal(mensagem, link), tel.numero),
    mascara: tel.mascara,
    reenviado: resultado.reenviado,
  }
}

/** Gera link novo (o antigo deixa de valer). Sem o número guardado, o WhatsApp abre a lista de contatos. */
export async function reenviarConvite(convidante: { id: string; name: string }, conviteId: string, origem: string, agora = new Date()) {
  const convite = await prisma.convite.findFirst({ where: { id: conviteId, convidanteId: convidante.id, status: "PENDENTE" } })
  if (!convite) return { erro: "Convite não encontrado ou já encerrado." }

  if (convite.expiraEm.getTime() <= agora.getTime()) {
    const pendentes = await prisma.convite.count({ where: { convidanteId: convidante.id, status: "PENDENTE", expiraEm: { gt: agora } } })
    if (pendentes >= LIMITES_SOCIAL.convitesPendentes) return { erro: "Você já tem convites demais aguardando resposta." }
  }

  const token = novoToken()
  await prisma.convite.update({ where: { id: convite.id }, data: { tokenHash: hashDoToken(token), expiraEm: dataDeExpiracao(agora) } })

  const pelotao = convite.comunidadeId ? await prisma.comunidade.findUnique({ where: { id: convite.comunidadeId } }) : null
  const link = `${origem}/convite/${token}`
  const texto = textoFinal(mensagemPadrao(convite.apelido, primeiroNome(convidante.name), pelotao?.nome), link)
  return { erro: null, link, whatsappUrl: urlWhatsapp(texto) }
}

export async function cancelarConvite(userId: string, conviteId: string) {
  const { count } = await prisma.convite.updateMany({
    where: { id: conviteId, convidanteId: userId, status: "PENDENTE" },
    data: { status: "CANCELADO" },
  })
  return count > 0 ? { erro: null } : { erro: "Convite não encontrado ou já encerrado." }
}

export async function listarConvites(userId: string, agora = new Date()) {
  const convites = await prisma.convite.findMany({ where: { convidanteId: userId }, orderBy: { criadoEm: "desc" }, take: 30 })
  if (convites.length === 0) return []

  const comIds = [...new Set(convites.flatMap((c) => (c.comunidadeId ? [c.comunidadeId] : [])))]
  const aceitoIds = [...new Set(convites.flatMap((c) => (c.aceitoPorId ? [c.aceitoPorId] : [])))]
  const [comunidades, aceitantes] = await Promise.all([
    prisma.comunidade.findMany({ where: { id: { in: comIds } }, select: { id: true, nome: true } }),
    prisma.user.findMany({ where: { id: { in: aceitoIds } }, select: { id: true, name: true } }),
  ])
  const nomeCom = new Map(comunidades.map((c) => [c.id, c.nome]))
  const nomeUser = new Map(aceitantes.map((u) => [u.id, u.name]))

  return convites.map((c) => ({
    id: c.id,
    apelido: c.apelido,
    mascara: c.telefoneMascara,
    status: statusEfetivo(c.status as StatusConvite, c.expiraEm, agora),
    criadoEm: c.criadoEm,
    expiraEm: c.expiraEm,
    pelotao: c.comunidadeId ? (nomeCom.get(c.comunidadeId) ?? "Pelotão excluído") : null,
    aceitoPor: c.aceitoPorId ? (nomeUser.get(c.aceitoPorId) ?? null) : null,
  }))
}

/** Página pública do convite. Mostra só o primeiro nome de quem convidou. */
export async function consultarConvite(token: string, agora = new Date()) {
  const convite = await prisma.convite.findUnique({ where: { tokenHash: hashDoToken(token) } })
  if (!convite) return null

  const [convidante, pelotao] = await Promise.all([
    prisma.user.findUnique({ where: { id: convite.convidanteId }, select: { name: true, ativo: true } }),
    convite.comunidadeId ? prisma.comunidade.findUnique({ where: { id: convite.comunidadeId }, select: { id: true, nome: true, cor: true } }) : null,
  ])
  if (!convidante?.ativo) return null

  if (!convite.abertoEm && convite.status === "PENDENTE") {
    await prisma.convite.update({ where: { id: convite.id }, data: { abertoEm: agora } }).catch(() => undefined)
  }

  return {
    id: convite.id,
    convidanteId: convite.convidanteId,
    convidanteNome: primeiroNome(convidante.name),
    apelido: convite.apelido,
    status: statusEfetivo(convite.status as StatusConvite, convite.expiraEm, agora),
    aceitoPorId: convite.aceitoPorId,
    pelotao,
  }
}

export async function aceitarConvite(userId: string, token: string, nivel: NivelVisibilidade, agora = new Date()) {
  const resultado = await prisma.$transaction(async (tx) => {
    const convite = await tx.convite.findUnique({ where: { tokenHash: hashDoToken(token) } })
    if (!convite) return { erro: "Convite inválido." }

    const status = statusEfetivo(convite.status as StatusConvite, convite.expiraEm, agora)
    // Idempotente: quem já aceitou e abre o link de novo só segue em frente
    if (status === "ACEITO" && convite.aceitoPorId === userId) return { erro: null, convidanteId: convite.convidanteId, comunidadeId: convite.comunidadeId }
    if (status === "ACEITO") return { erro: "Este convite já foi usado." }
    if (status !== "PENDENTE") return { erro: "Este convite expirou ou foi cancelado." }
    if (convite.convidanteId === userId) return { erro: "Você não pode aceitar o seu próprio convite." }

    const convidante = await tx.user.findUnique({ where: { id: convite.convidanteId }, select: { ativo: true } })
    if (!convidante?.ativo) return { erro: "Convite indisponível." }

    const [a, b] = parOrdenado(userId, convite.convidanteId)
    const euSouA = a === userId
    const par = { usuarioAId_usuarioBId: { usuarioAId: a, usuarioBId: b } }
    const existente = await tx.amizade.findUnique({ where: par })
    if (existente) {
      await tx.amizade.update({ where: par, data: euSouA ? { aMostra: nivel } : { bMostra: nivel } })
    } else {
      await tx.amizade.create({
        data: { usuarioAId: a, usuarioBId: b, origemConviteId: convite.id, ...(euSouA ? { aMostra: nivel } : { bMostra: nivel }) },
      })
    }

    if (convite.comunidadeId) {
      const com = await tx.comunidade.findUnique({ where: { id: convite.comunidadeId } })
      if (com) {
        const membro = await tx.membroComunidade.findUnique({ where: { comunidadeId_userId: { comunidadeId: com.id, userId } } })
        const total = await tx.membroComunidade.count({ where: { comunidadeId: com.id } })
        if (!membro && total < LIMITES_SOCIAL.membrosPorComunidade) {
          await tx.membroComunidade.create({ data: { comunidadeId: com.id, userId } })
        }
      }
    }

    await tx.convite.update({ where: { id: convite.id }, data: { status: "ACEITO", aceitoEm: agora, aceitoPorId: userId } })
    return { erro: null, convidanteId: convite.convidanteId, comunidadeId: convite.comunidadeId }
  })

  // Quem convidou ganha o emblema de Recrutador (fora da transação: é só um bônus)
  if (resultado.erro === null) await sincronizarEmblemasSemErro(resultado.convidanteId)
  return resultado
}
