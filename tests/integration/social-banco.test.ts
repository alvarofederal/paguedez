import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
vi.mock("server-only", () => ({}))
import prisma from "@/lib/prisma"
import { aceitarConvite, cancelarConvite, consultarConvite, criarConvite, listarConvites, reenviarConvite } from "@/server/convites"
import { definirMinhaVisibilidade, desfazerAmizade, listarAmigos, nivelQueAmigoMostra } from "@/server/amizades"
import {
  amigosParaConvocar, atualizarComunidade, convocarAmigo, criarComunidade, entrarPorCodigo, excluirComunidade, listarConvocacoes,
  listarMinhasComunidades, obterComunidade, removerMembro, responderConvocacao, sairDaComunidade,
} from "@/server/comunidades"
import { parOrdenado } from "@/lib/amizade"
import { listarEmblemas } from "@/server/emblemas"
import { rankingDe } from "@/server/ranking"
import { diaBrasilia } from "@/lib/periodos"

const origem = "https://teste.local"
const tag = `tst${Date.now()}`
const ids: Record<string, string> = {}

async function novoUsuario(chave: string, nome: string) {
  const u = await prisma.user.create({ data: { name: nome, email: `${tag}.${chave}@paguedez.test`, password: "x", sexo: "MASCULINO" } })
  ids[chave] = u.id
  return { id: u.id, name: nome }
}
const tokenDe = (link: string) => link.split("/convite/")[1]

let A: { id: string; name: string }
let B: { id: string; name: string }
let C: { id: string; name: string }
let D: { id: string; name: string }

beforeAll(async () => {
  A = await novoUsuario("a", "Alvaro Teste")
  B = await novoUsuario("b", "Beto Teste")
  C = await novoUsuario("c", "Caio Teste")
  D = await novoUsuario("d", "Dani Teste")
})

afterAll(async () => {
  const todos = Object.values(ids)
  const coms = await prisma.comunidade.findMany({ where: { donoId: { in: todos } }, select: { id: true } })
  await prisma.membroComunidade.deleteMany({ where: { OR: [{ userId: { in: todos } }, { comunidadeId: { in: coms.map((c) => c.id) } }] } })
  await prisma.comunidade.deleteMany({ where: { donoId: { in: todos } } })
  await prisma.convocacao.deleteMany({ where: { OR: [{ convidadoId: { in: todos } }, { convidanteId: { in: todos } }] } })
  await prisma.convite.deleteMany({ where: { convidanteId: { in: todos } } })
  await prisma.amizade.deleteMany({ where: { OR: [{ usuarioAId: { in: todos } }, { usuarioBId: { in: todos } }] } })
  await prisma.emblema.deleteMany({ where: { userId: { in: todos } } })
  await prisma.registro.deleteMany({ where: { userId: { in: todos } } })
  await prisma.user.deleteMany({ where: { id: { in: todos } } })
  await prisma.$disconnect()
})

describe("convite 1:1", () => {
  let link1 = ""
  let conviteId = ""

  it("cria o convite sem guardar o telefone inteiro", async () => {
    const r = await criarConvite(A, { apelido: "Beto", telefone: "(11) 99999-8888" }, origem)
    expect(r.erro).toBeNull()
    if (r.erro !== null) return
    link1 = r.link
    conviteId = r.conviteId
    expect(r.link.startsWith(`${origem}/convite/`)).toBe(true)
    expect(r.whatsappUrl.startsWith("https://wa.me/5511999998888?text=")).toBe(true)
    expect(decodeURIComponent(r.whatsappUrl)).toContain(r.link)

    const linha = await prisma.convite.findUniqueOrThrow({ where: { id: conviteId } })
    expect(linha.telefoneMascara).toBe("(11) 9****-8888")
    expect(JSON.stringify(linha)).not.toContain("999998888")
    expect(JSON.stringify(linha)).not.toContain(tokenDe(link1)) // só o hash do token fica no banco
  })

  it("mesmo amigo de novo = reenvio: 1 convite só, link antigo morre", async () => {
    const r = await criarConvite(A, { apelido: "Beto", telefone: "11999998888" }, origem)
    expect(r.erro).toBeNull()
    if (r.erro !== null) return
    expect(r.reenviado).toBe(true)
    expect(await prisma.convite.count({ where: { convidanteId: A.id } })).toBe(1)
    expect(await consultarConvite(tokenDe(link1))).toBeNull()
    link1 = r.link
  })

  it("página pública mostra só o primeiro nome de quem convidou", async () => {
    const c = await consultarConvite(tokenDe(link1))
    expect(c).toMatchObject({ convidanteNome: "Alvaro", status: "PENDENTE", pelotao: null })
  })

  it("aceitar cria a amizade (nível do aceitante) e dá o emblema Recrutador a quem convidou", async () => {
    const r = await aceitarConvite(B.id, tokenDe(link1), 1)
    expect(r.erro).toBeNull()

    const amigosDeA = await listarAmigos(A.id)
    expect(amigosDeA).toHaveLength(1)
    expect(amigosDeA[0]).toMatchObject({ userId: B.id, euMostro: 0, elesMostram: 1 })
    expect(await nivelQueAmigoMostra(A.id, B.id)).toBe(1)
    expect(await nivelQueAmigoMostra(B.id, A.id)).toBe(0)

    const { emblemas } = await listarEmblemas(A.id)
    expect(emblemas.find((e) => e.tipo === "RECRUTADOR")?.conquistadoEm).not.toBeNull()
    expect(emblemas.find((e) => e.tipo === "COMANDANTE")?.conquistadoEm).toBeNull()
  })

  it("o mesmo aceitante pode abrir de novo (idempotente); outro não pode usar", async () => {
    expect((await aceitarConvite(B.id, tokenDe(link1), 1)).erro).toBeNull()
    expect((await aceitarConvite(C.id, tokenDe(link1), 0)).erro).toBe("Este convite já foi usado.")
  })

  it("não aceita o próprio convite", async () => {
    const r = await criarConvite(A, { apelido: "Eu", telefone: "11988887777" }, origem)
    if (r.erro !== null) throw new Error(r.erro)
    expect((await aceitarConvite(A.id, tokenDe(r.link), 0)).erro).toBe("Você não pode aceitar o seu próprio convite.")
  })

  it("cancelar invalida o link", async () => {
    const r = await criarConvite(A, { apelido: "Cancelado", telefone: "11977776666" }, origem)
    if (r.erro !== null) throw new Error(r.erro)
    expect((await cancelarConvite(A.id, r.conviteId)).erro).toBeNull()
    expect((await aceitarConvite(C.id, tokenDe(r.link), 0)).erro).toBe("Este convite expirou ou foi cancelado.")
  })

  it("expirado não aceita; reenviar renova", async () => {
    const r = await criarConvite(A, { apelido: "Velho", telefone: "11966665555" }, origem)
    if (r.erro !== null) throw new Error(r.erro)
    await prisma.convite.update({ where: { id: r.conviteId }, data: { expiraEm: new Date(Date.now() - 1000) } })
    expect((await aceitarConvite(C.id, tokenDe(r.link), 0)).erro).toBe("Este convite expirou ou foi cancelado.")
    const lista = await listarConvites(A.id)
    expect(lista.find((c) => c.id === r.conviteId)?.status).toBe("EXPIRADO")

    const novo = await reenviarConvite(A, r.conviteId, origem)
    expect(novo.erro).toBeNull()
    if (novo.erro !== null) return
    expect(novo.whatsappUrl.startsWith("https://wa.me/?text=")).toBe(true)
    expect((await aceitarConvite(C.id, tokenDe(novo.link), 0)).erro).toBeNull()
  })

  it("anti-spam: no máximo 5 pendentes ao mesmo tempo", async () => {
    // já há 0 pendentes de A neste ponto (todos aceitos/cancelados/expirados)
    let ultimo: { erro: string } | { erro: null } = { erro: null }
    for (let i = 0; i < 6; i++) {
      ultimo = await criarConvite(A, { apelido: `P${i}`, telefone: `1195555${String(1000 + i)}` }, origem)
    }
    expect(ultimo.erro).toMatch(/aguardando resposta/)
    expect(await prisma.convite.count({ where: { convidanteId: A.id, status: "PENDENTE" } })).toBe(5)

    // cancelar libera as vagas (e o teto diário de 10 ainda não foi atingido por quem fica abaixo dele)
    await prisma.convite.updateMany({ where: { convidanteId: A.id, status: "PENDENTE" }, data: { status: "CANCELADO" } })
    await prisma.convite.deleteMany({ where: { convidanteId: A.id, status: "CANCELADO", criadoEm: { lt: new Date(Date.now() - 1) } } }) // zera o contador de 24h para os próximos testes
  })
})

describe("visibilidade entre amigos", () => {
  it("cada lado define o que mostra; desfazer apaga a amizade", async () => {
    expect((await definirMinhaVisibilidade(A.id, B.id, 2)).erro).toBeNull()
    expect(await nivelQueAmigoMostra(B.id, A.id)).toBe(2)
    expect(await nivelQueAmigoMostra(A.id, B.id)).toBe(1) // o de B não mudou

    expect((await desfazerAmizade(A.id, B.id)).erro).toBeNull()
    expect(await nivelQueAmigoMostra(A.id, B.id)).toBeNull()
    expect((await definirMinhaVisibilidade(A.id, B.id, 0)).erro).toBe("Amizade não encontrada")
  })
})

describe("comunidade (pelotão)", () => {
  let comId = ""
  let codigo = ""

  it("cria pelotão: dono vira membro e ganha o emblema Comandante", async () => {
    const r = await criarComunidade(A.id, { nome: "Pelotão Teste", cor: "menta", nivelVisibilidade: 2 })
    expect(r.erro).toBeNull()
    if (r.erro !== null) return
    comId = r.id
    const lista = await listarMinhasComunidades(A.id)
    expect(lista[0]).toMatchObject({ nome: "Pelotão Teste", membros: 1, meuPapel: "DONO", nivelVisibilidade: 2 })
    codigo = lista[0].codigoEntrada
    const { emblemas } = await listarEmblemas(A.id)
    expect(emblemas.find((e) => e.tipo === "COMANDANTE")?.conquistadoEm).not.toBeNull()
  })

  it("convite para o pelotão: aceitar entra no pelotão e vira amigo", async () => {
    const r = await criarConvite(A, { apelido: "Dani", telefone: "11944443333", comunidadeId: comId }, origem)
    if (r.erro !== null) throw new Error(r.erro)
    expect(decodeURIComponent(r.whatsappUrl)).toContain("Pelotão Teste")
    const info = await consultarConvite(tokenDe(r.link))
    expect(info?.pelotao?.nome).toBe("Pelotão Teste")

    expect((await aceitarConvite(D.id, tokenDe(r.link), 0)).erro).toBeNull()
    const ver = await obterComunidade(comId, D.id)
    expect(ver?.membros.map((m) => m.userId).sort()).toEqual([A.id, D.id].sort())
  })

  it("quem não é membro não enxerga o pelotão; não-membro não convida para ele", async () => {
    expect(await obterComunidade(comId, C.id)).toBeNull()
    const r = await criarConvite(C, { apelido: "X", telefone: "11933332222", comunidadeId: comId }, origem)
    expect(r.erro).toBe("Pelotão não encontrado.")
  })

  it("link de entrada: entra, respeita 'entrada ativa' e não duplica", async () => {
    expect((await entrarPorCodigo(C.id, codigo)).erro).toBeNull()
    expect((await entrarPorCodigo(C.id, codigo)).erro).toBeNull() // idempotente
    expect((await obterComunidade(comId, A.id))?.membros).toHaveLength(3)

    await atualizarComunidade(A.id, comId, { nome: "Pelotão Teste", cor: "menta", nivelVisibilidade: 1, entradaAtiva: false })
    expect((await entrarPorCodigo(B.id, codigo)).erro).toMatch(/não está mais disponível/)
    expect((await obterComunidade(comId, A.id))?.comunidade.nivelVisibilidade).toBe(1) // só o dono mudou o nível
  })

  it("só o dono administra; membro pode sair; dono não", async () => {
    expect((await atualizarComunidade(C.id, comId, { nome: "Hack", cor: "sol", nivelVisibilidade: 2, entradaAtiva: true })).erro).toMatch(/comandante/)
    expect((await removerMembro(C.id, comId, D.id)).erro).toMatch(/comandante/)
    expect((await sairDaComunidade(A.id, comId)).erro).toMatch(/comandante/)
    expect((await removerMembro(A.id, comId, D.id)).erro).toBeNull()
    expect((await sairDaComunidade(C.id, comId)).erro).toBeNull()
    expect(await obterComunidade(comId, C.id)).toBeNull()
  })

  it("ranking do pelotão: soma do período, empate por quem chegou primeiro, zero no fim", async () => {
    const dia = diaBrasilia()
    await prisma.registro.createMany({
      data: [
        { userId: A.id, quantidade: 30, dia, feitoEm: new Date(Date.now() - 3000) },
        { userId: B.id, quantidade: 50, dia, feitoEm: new Date(Date.now() - 2000) },
        { userId: D.id, quantidade: 30, dia, feitoEm: new Date(Date.now() - 4000) },
      ],
    })
    const r = await rankingDe([A.id, B.id, C.id, D.id], "DIARIO")
    expect(r.map((l) => [l.userId, l.total, l.posicao])).toEqual([
      [B.id, 50, 1],
      [D.id, 30, 2], // empate com A: D chegou antes
      [A.id, 30, 3],
      [C.id, 0, 4],
    ])
    expect((await rankingDe([A.id], "ANUAL"))[0].total).toBe(30)
  })

  it("ranking ignora conta desativada", async () => {
    await prisma.user.update({ where: { id: D.id }, data: { ativo: false } })
    expect((await rankingDe([A.id, D.id], "DIARIO")).map((l) => l.userId)).toEqual([A.id])
    await prisma.user.update({ where: { id: D.id }, data: { ativo: true } })
  })

  it("excluir pelotão remove membros e cancela convites pendentes dele", async () => {
    const pend = await criarConvite(A, { apelido: "Y", telefone: "11922221111", comunidadeId: comId }, origem)
    expect(pend.erro).toBeNull()
    expect((await excluirComunidade(C.id, comId)).erro).toMatch(/comandante/)
    expect((await excluirComunidade(A.id, comId)).erro).toBeNull()
    expect(await prisma.membroComunidade.count({ where: { comunidadeId: comId } })).toBe(0)
    expect(await prisma.convite.count({ where: { comunidadeId: comId, status: "PENDENTE" } })).toBe(0)
  })
})

describe("emblemas por uso", () => {
  it("Centenário e Persistente respeitam o limite", async () => {
    const antes = await listarEmblemas(B.id)
    expect(antes.emblemas.find((e) => e.tipo === "CENTENARIO")?.conquistadoEm).toBeNull() // B só tem 50
    await prisma.registro.create({ data: { userId: B.id, quantidade: 50, dia: "2026-01-01" } })
    const depois = await listarEmblemas(B.id)
    expect(depois.emblemas.find((e) => e.tipo === "CENTENARIO")?.conquistadoEm).not.toBeNull()
  })
})

describe("convocar amigo que já está no app", () => {
  let comId = ""
  const amizade = async (x: string, y: string) => {
    const [a, b] = parOrdenado(x, y)
    await prisma.amizade.upsert({ where: { usuarioAId_usuarioBId: { usuarioAId: a, usuarioBId: b } }, update: {}, create: { usuarioAId: a, usuarioBId: b } })
  }

  it("prepara: A comanda um pelotão e é amigo de B e D (C não é amigo de ninguém)", async () => {
    await prisma.emblema.deleteMany({ where: { userId: A.id } })
    await prisma.comunidade.deleteMany({ where: { donoId: A.id } })
    await prisma.membroComunidade.deleteMany({ where: { userId: { in: [A.id, B.id, C.id, D.id] } } })
    const r = await criarComunidade(A.id, { nome: "Veteranos 1996", cor: "sol", nivelVisibilidade: 1 })
    if (r.erro !== null) throw new Error(r.erro)
    comId = r.id
    // testes anteriores deixaram amizades: aqui só B e D são amigos de A; C é estranha
    const [x, y] = parOrdenado(A.id, C.id)
    await prisma.amizade.deleteMany({ where: { usuarioAId: x, usuarioBId: y } })
    await amizade(A.id, B.id)
    await amizade(A.id, D.id)
  })

  it("lista só amigos que ainda não estão no pelotão", async () => {
    const lista = await amigosParaConvocar(A.id, comId)
    expect(lista.map((x) => x.userId).sort()).toEqual([B.id, D.id].sort())
    expect(lista.every((x) => x.pendente === false)).toBe(true)
    expect(await amigosParaConvocar(C.id, comId)).toEqual([]) // quem não é do pelotão não vê nada
  })

  it("só convoca amigo; estranho e não-membro são barrados", async () => {
    expect((await convocarAmigo(A.id, comId, C.id)).erro).toMatch(/não é seu amigo/)
    expect((await convocarAmigo(C.id, comId, B.id)).erro).toMatch(/pode convocar/)
    expect((await convocarAmigo(A.id, comId, A.id)).erro).toMatch(/já está/)
  })

  it("convoca B: fica pendente (não entra sozinho) e repetir não duplica", async () => {
    expect(await convocarAmigo(A.id, comId, B.id)).toEqual({ erro: null, jaPendente: false })
    expect(await convocarAmigo(A.id, comId, B.id)).toEqual({ erro: null, jaPendente: true })
    expect(await prisma.convocacao.count({ where: { comunidadeId: comId, convidadoId: B.id } })).toBe(1)
    expect(await obterComunidade(comId, B.id)).toBeNull() // ainda não é membro
    expect((await amigosParaConvocar(A.id, comId)).find((x) => x.userId === B.id)?.pendente).toBe(true)

    const pend = await listarConvocacoes(B.id)
    expect(pend).toHaveLength(1)
    expect(pend[0]).toMatchObject({ nome: "Veteranos 1996", nivelVisibilidade: 1 })
    expect(await listarConvocacoes(D.id)).toEqual([])
  })

  it("só o convidado responde; recusar não entra e não pode ser reconvocado", async () => {
    const [conv] = await listarConvocacoes(B.id)
    expect((await responderConvocacao(C.id, conv.id, true)).erro).toBe("Convocação não encontrada.")
    expect((await responderConvocacao(B.id, conv.id, false)).erro).toBeNull()
    expect(await obterComunidade(comId, B.id)).toBeNull()
    expect((await responderConvocacao(B.id, conv.id, true)).erro).toBe("Você já respondeu a esta convocação.")
    expect((await convocarAmigo(A.id, comId, B.id)).erro).toMatch(/já respondeu/)
    expect(await listarConvocacoes(B.id)).toEqual([])
  })

  it("aceitar entra no pelotão; quem saiu pode ser chamado de novo", async () => {
    expect((await convocarAmigo(A.id, comId, D.id)).erro).toBeNull()
    const [conv] = await listarConvocacoes(D.id)
    const r = await responderConvocacao(D.id, conv.id, true)
    expect(r).toEqual({ erro: null, comunidadeId: comId })
    expect((await obterComunidade(comId, D.id))?.membros.map((m) => m.userId).sort()).toEqual([A.id, D.id].sort())
    expect((await convocarAmigo(A.id, comId, D.id)).erro).toMatch(/já está no pelotão/)
    expect((await amigosParaConvocar(A.id, comId)).map((x) => x.userId)).toEqual([B.id]) // D saiu da lista

    expect((await sairDaComunidade(D.id, comId)).erro).toBeNull()
    expect((await convocarAmigo(A.id, comId, D.id)).erro).toBeNull() // aceitou e saiu: pode ser chamado de novo
    expect(await listarConvocacoes(D.id)).toHaveLength(1)
  })

  it("convocação some quando o pelotão é excluído", async () => {
    expect((await excluirComunidade(A.id, comId)).erro).toBeNull()
    expect(await listarConvocacoes(D.id)).toEqual([])
    expect(await prisma.convocacao.count({ where: { comunidadeId: comId } })).toBe(0)
  })
})
