import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

// vi.mock é executado antes de tudo: a etiqueta precisa ser criada com vi.hoisted
const { tag } = vi.hoisted(() => ({ tag: `exc${Date.now()}` }))
// O "administrador" deste teste é uma conta de mentira: o perfil real nunca é tocado
vi.mock("@/lib/admin", () => ({
  EMAIL_ADMIN: `adm.${tag}@paguedez.test`,
  papelPorEmail: (email: string) => (email === `adm.${tag}@paguedez.test` ? "ADMIN" : "USUARIO"),
}))
vi.mock("server-only", () => ({}))

import prisma from "@/lib/prisma"
import { excluirUsuario } from "@/server/usuarios"
import { parOrdenado } from "@/lib/amizade"

const ids: Record<string, string> = {}
async function usuario(chave: string, email = `${tag}.${chave}@paguedez.test`) {
  ids[chave] = (await prisma.user.create({ data: { name: `Teste ${chave}`, email, password: "x", sexo: "MASCULINO" } })).id
  return ids[chave]
}

beforeAll(async () => {
  await usuario("adm", `adm.${tag}@paguedez.test`)
  await usuario("curioso")
  await usuario("ativo")
  await usuario("amigo")
})

afterAll(async () => {
  const todos = Object.values(ids)
  const coms = (await prisma.comunidade.findMany({ where: { donoId: { in: todos } }, select: { id: true } })).map((c) => c.id)
  await prisma.convocacao.deleteMany({ where: { OR: [{ convidadoId: { in: todos } }, { convidanteId: { in: todos } }] } })
  await prisma.membroComunidade.deleteMany({ where: { OR: [{ userId: { in: todos } }, { comunidadeId: { in: coms } }] } })
  await prisma.comunidade.deleteMany({ where: { donoId: { in: todos } } })
  await prisma.convite.deleteMany({ where: { OR: [{ convidanteId: { in: todos } }, { aceitoPorId: { in: todos } }] } })
  await prisma.amizade.deleteMany({ where: { OR: [{ usuarioAId: { in: todos } }, { usuarioBId: { in: todos } }] } })
  await prisma.patenteConquistada.deleteMany({ where: { userId: { in: todos } } })
  await prisma.emblema.deleteMany({ where: { userId: { in: todos } } })
  await prisma.taca.deleteMany({ where: { userId: { in: todos } } })
  await prisma.registro.deleteMany({ where: { userId: { in: todos } } })
  await prisma.user.deleteMany({ where: { id: { in: todos } } })
  await prisma.$disconnect()
})

describe("excluir perfil", () => {
  it("o administrador nunca pode ser excluído", async () => {
    expect((await excluirUsuario(ids.adm)).erro).toBe("O administrador não pode ser excluído")
    expect(await prisma.user.count({ where: { id: ids.adm } })).toBe(1)
  })

  it("usuário inexistente dá erro amigável", async () => {
    expect((await excluirUsuario("nao-existe")).erro).toBe("Usuário não encontrado")
  })

  it("perfil curioso (sem nenhuma série) é excluído direto", async () => {
    expect((await excluirUsuario(ids.curioso)).erro).toBeNull()
    expect(await prisma.user.count({ where: { id: ids.curioso } })).toBe(0)
  })

  it("perfil com séries ATIVO é bloqueado; desativado, é excluído com tudo o que era dele", async () => {
    const A = ids.ativo
    const B = ids.amigo
    const [x, y] = parOrdenado(A, B)
    await prisma.registro.create({ data: { userId: A, quantidade: 30, dia: "2026-01-01" } })
    await prisma.registro.create({ data: { userId: B, quantidade: 40, dia: "2026-01-01" } })
    await prisma.taca.create({ data: { userId: A, tipo: "PRIMEIRA", periodo: "2026-01-01", valor: 30, nivel: 1 } })
    await prisma.emblema.create({ data: { userId: A, tipo: "RECRUTA" } })
    await prisma.patenteConquistada.create({ data: { userId: A, patente: "RECRUTA" } })
    await prisma.amizade.create({ data: { usuarioAId: x, usuarioBId: y } })
    const com = await prisma.comunidade.create({ data: { donoId: A, nome: "Do Ativo", cor: "sol", codigoEntrada: `c${tag}` } })
    await prisma.membroComunidade.createMany({ data: [{ comunidadeId: com.id, userId: A, papel: "DONO" }, { comunidadeId: com.id, userId: B }] })
    await prisma.convocacao.create({ data: { comunidadeId: com.id, convidadoId: B, convidanteId: A } })
    await prisma.convite.create({
      data: { convidanteId: A, comunidadeId: com.id, apelido: "x", telefoneHmac: `h${tag}`, telefoneMascara: "m", tokenHash: `t${tag}`, expiraEm: new Date(Date.now() + 1e9) },
    })
    // convite do AMIGO que o "ativo" aceitou: deve continuar existindo, só sem o vínculo
    const doAmigo = await prisma.convite.create({
      data: { convidanteId: B, apelido: "y", telefoneHmac: `h2${tag}`, telefoneMascara: "m", tokenHash: `t2${tag}`, expiraEm: new Date(Date.now() + 1e9), status: "ACEITO", aceitoPorId: A },
    })

    expect((await excluirUsuario(A)).erro).toMatch(/Desative-o primeiro/)
    expect(await prisma.user.count({ where: { id: A } })).toBe(1) // nada foi apagado

    await prisma.user.update({ where: { id: A }, data: { ativo: false } })
    expect((await excluirUsuario(A)).erro).toBeNull()

    // tudo dele sumiu
    expect(await prisma.user.count({ where: { id: A } })).toBe(0)
    expect(await prisma.registro.count({ where: { userId: A } })).toBe(0)
    expect(await prisma.taca.count({ where: { userId: A } })).toBe(0)
    expect(await prisma.emblema.count({ where: { userId: A } })).toBe(0)
    expect(await prisma.patenteConquistada.count({ where: { userId: A } })).toBe(0)
    expect(await prisma.amizade.count({ where: { OR: [{ usuarioAId: A }, { usuarioBId: A }] } })).toBe(0)
    expect(await prisma.comunidade.count({ where: { donoId: A } })).toBe(0) // o pelotão que ele comandava
    expect(await prisma.membroComunidade.count({ where: { comunidadeId: com.id } })).toBe(0)
    expect(await prisma.convocacao.count({ where: { comunidadeId: com.id } })).toBe(0)
    expect(await prisma.convite.count({ where: { convidanteId: A } })).toBe(0)

    // o amigo continua intacto, e o convite dele só perdeu o vínculo com a conta apagada
    expect(await prisma.user.count({ where: { id: B } })).toBe(1)
    expect(await prisma.registro.count({ where: { userId: B } })).toBe(1)
    const conv = await prisma.convite.findUniqueOrThrow({ where: { id: doAmigo.id } })
    expect(conv).toMatchObject({ status: "ACEITO", aceitoPorId: null })
  })
})
