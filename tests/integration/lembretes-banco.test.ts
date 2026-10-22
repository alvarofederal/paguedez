import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
vi.mock("server-only", () => ({}))
import prisma from "@/lib/prisma"
import { diaBrasilia } from "@/lib/periodos"
import { LIMITES_LEMBRETES } from "@/lib/planos"
import { atualizarLembrete, criarLembrete, enviarTeste, excluirLembrete, executarLembretes, listarLembretes } from "@/server/lembretes"
import type { Entrega } from "@/server/push"

const tag = `lem${Date.now()}`
const ids: Record<string, string> = {}
// 22:05 UTC = 19:05 em Brasília
const SEG_19H05 = new Date("2026-10-22T22:05:00Z")
const DIA = diaBrasilia(SEG_19H05)

type Chamada = { userId: string; titulo: string; corpo: string }
function fingir(retorno: Entrega) {
  const chamadas: Chamada[] = []
  const enviar = async (userId: string, payload: { titulo: string; corpo: string }) => {
    chamadas.push({ userId, titulo: payload.titulo, corpo: payload.corpo })
    return retorno
  }
  return { chamadas, enviar: enviar as never }
}
const ENVIADO: Entrega = { enviadas: 1, removidas: 0, falhas: 0 }

async function usuario(chave: string) {
  ids[chave] = (await prisma.user.create({ data: { name: `Lembrete ${chave}`, email: `${tag}.${chave}@paguedez.test`, password: "x", sexo: "MASCULINO" } })).id
  return ids[chave]
}
const novoLembrete = (userId: string, hora = "19:00", extra: Record<string, unknown> = {}) =>
  prisma.lembrete.create({ data: { userId, hora, ...extra } })

beforeAll(async () => {
  for (const c of ["a", "b", "c", "d", "e", "f"]) await usuario(c)
})

afterAll(async () => {
  const todos = Object.values(ids)
  const lembretes = (await prisma.lembrete.findMany({ where: { userId: { in: todos } }, select: { id: true } })).map((l) => l.id)
  await prisma.lembreteEnvio.deleteMany({ where: { lembreteId: { in: lembretes } } })
  await prisma.lembrete.deleteMany({ where: { userId: { in: todos } } })
  await prisma.pushInscricao.deleteMany({ where: { userId: { in: todos } } })
  await prisma.registro.deleteMany({ where: { userId: { in: todos } } })
  await prisma.user.deleteMany({ where: { id: { in: todos } } })
  await prisma.$disconnect()
})

describe("agenda (CRUD)", () => {
  it("valida horário e dias, respeita o limite e só mexe nos próprios lembretes", async () => {
    const A = ids.a
    expect((await criarLembrete(A, { hora: "25:00", diasSemana: 127, somenteSePendente: true })).erro).toMatch(/Horário inválido/)
    expect((await criarLembrete(A, { hora: "07:00", diasSemana: 0, somenteSePendente: true })).erro).toMatch(/pelo menos um dia/)

    for (let i = 0; i < LIMITES_LEMBRETES.porUsuario; i++) {
      const r = await criarLembrete(A, { hora: `${String(6 + i).padStart(2, "0")}:00`, diasSemana: 127, somenteSePendente: true })
      expect(r.erro).toBeNull()
    }
    expect((await criarLembrete(A, { hora: "23:00", diasSemana: 127, somenteSePendente: true })).erro).toMatch(/máximo/)

    const lista = await listarLembretes(A)
    expect(lista.map((l) => l.hora)).toEqual([...lista.map((l) => l.hora)].sort()) // ordenada por hora

    const alheio = lista[0].id
    expect((await atualizarLembrete(ids.b, alheio, { hora: "01:00" })).erro).toBe("Lembrete não encontrado.")
    expect((await excluirLembrete(ids.b, alheio)).erro).toBe("Lembrete não encontrado.")
    expect((await atualizarLembrete(A, alheio, { hora: "05:30", ativo: false })).erro).toBeNull()
    expect((await excluirLembrete(A, alheio)).erro).toBeNull()
    await prisma.lembrete.deleteMany({ where: { userId: A } })
  })
})

describe("executar lembretes", () => {
  it("envia no horário, uma única vez por dia", async () => {
    const l = await novoLembrete(ids.a)
    const f = fingir(ENVIADO)

    const r1 = await executarLembretes(SEG_19H05, f.enviar)
    expect(r1).toMatchObject({ enviados: 1 })
    expect(f.chamadas.filter((c) => c.userId === ids.a)).toHaveLength(1)
    expect(f.chamadas[0].corpo).toMatch(/ainda não pagou nenhuma fleca hoje|pague dez|Leva menos de um minuto/i)
    expect((await prisma.lembreteEnvio.findUniqueOrThrow({ where: { lembreteId_dia: { lembreteId: l.id, dia: DIA } } })).status).toBe("ENVIADO")

    // segunda execução no mesmo dia (outro minuto): nada novo
    const f2 = fingir(ENVIADO)
    await executarLembretes(new Date(SEG_19H05.getTime() + 10 * 60_000), f2.enviar)
    expect(f2.chamadas.filter((c) => c.userId === ids.a)).toHaveLength(0)
  })

  it("duas execuções ao mesmo tempo: só uma envia (a chave única segura a outra)", async () => {
    await novoLembrete(ids.b)
    const f = fingir(ENVIADO)
    await Promise.all([executarLembretes(SEG_19H05, f.enviar), executarLembretes(SEG_19H05, f.enviar)])
    expect(f.chamadas.filter((c) => c.userId === ids.b)).toHaveLength(1)
    const idsDeB = (await prisma.lembrete.findMany({ where: { userId: ids.b }, select: { id: true } })).map((x) => x.id)
    expect(await prisma.lembreteEnvio.count({ where: { dia: DIA, lembreteId: { in: idsDeB } } })).toBe(1)
  })

  it("quem já pagou hoje não recebe (e fica registrado); sem a regra, recebe", async () => {
    await novoLembrete(ids.c)
    await prisma.registro.create({ data: { userId: ids.c, quantidade: 30, dia: DIA } })
    const f = fingir(ENVIADO)
    const r = await executarLembretes(SEG_19H05, f.enviar)
    expect(f.chamadas.filter((c) => c.userId === ids.c)).toHaveLength(0)
    expect(r.jaPagaram).toBeGreaterThanOrEqual(1)

    await novoLembrete(ids.d, "19:00", { somenteSePendente: false })
    await prisma.registro.create({ data: { userId: ids.d, quantidade: 30, dia: DIA } })
    const f2 = fingir(ENVIADO)
    await executarLembretes(SEG_19H05, f2.enviar)
    const paraD = f2.chamadas.find((c) => c.userId === ids.d)
    expect(paraD?.titulo).toMatch(/hoje você já pagou 30/i)
  })

  it("fora da janela, fora do dia da semana, inativo ou usuário desativado: não envia", async () => {
    await novoLembrete(ids.e, "19:00", { ativo: false })
    await novoLembrete(ids.e, "20:30") // ainda não chegou
    await novoLembrete(ids.e, "15:00") // já passou da tolerância (19:05 - 15:00 > 2h)
    await novoLembrete(ids.e, "19:00", { diasSemana: 1 }) // só segunda; 22/10/2026 é quinta
    await prisma.user.update({ where: { id: ids.f }, data: { ativo: false } })
    await novoLembrete(ids.f)

    const f = fingir(ENVIADO)
    await executarLembretes(SEG_19H05, f.enviar)
    expect(f.chamadas.filter((c) => c.userId === ids.e || c.userId === ids.f)).toHaveLength(0)
    await prisma.user.update({ where: { id: ids.f }, data: { ativo: true } })
  })

  it("registra o resultado quando não há aparelho ou quando o envio falha", async () => {
    await prisma.lembrete.deleteMany({ where: { userId: ids.e } })
    await prisma.lembreteEnvio.deleteMany({ where: { dia: DIA, lembreteId: { in: (await prisma.lembrete.findMany({ where: { userId: ids.e }, select: { id: true } })).map((x) => x.id) } } })
    const sem = await novoLembrete(ids.e)
    const r1 = await executarLembretes(SEG_19H05, fingir({ enviadas: 0, removidas: 0, falhas: 0 }).enviar)
    expect(r1.semAparelho).toBeGreaterThanOrEqual(1)
    expect((await prisma.lembreteEnvio.findUniqueOrThrow({ where: { lembreteId_dia: { lembreteId: sem.id, dia: DIA } } })).status).toBe("SEM_INSCRICAO")

    // outro dia, mesma agenda: agora o envio falha
    const OUTRO = new Date(SEG_19H05.getTime() + 24 * 3600_000)
    const r2 = await executarLembretes(OUTRO, fingir({ enviadas: 0, removidas: 0, falhas: 1 }).enviar)
    expect(r2.falhas).toBeGreaterThanOrEqual(1)
    expect((await prisma.lembreteEnvio.findUniqueOrThrow({ where: { lembreteId_dia: { lembreteId: sem.id, dia: diaBrasilia(OUTRO) } } })).status).toBe("FALHOU")
  })

  it("um erro no envio de um usuário não derruba os outros", async () => {
    const OUTRO = new Date(SEG_19H05.getTime() + 48 * 3600_000)
    const chamadas: string[] = []
    const enviar = (async (userId: string) => {
      chamadas.push(userId)
      if (userId === ids.a) throw new Error("serviço de push fora do ar")
      return ENVIADO
    }) as never
    const r = await executarLembretes(OUTRO, enviar)
    expect(r.falhas).toBeGreaterThanOrEqual(1)
    expect(chamadas.length).toBeGreaterThan(1) // os demais foram atendidos mesmo com o erro do primeiro
  })
})

describe("notificação de teste", () => {
  it("exige aparelho ativado e respeita o intervalo entre testes", async () => {
    const U = ids.f
    expect((await enviarTeste(U)).erro).toMatch(/Nenhum aparelho/)

    await prisma.pushInscricao.create({
      data: { userId: U, endpointHash: `h${tag}`, endpoint: "https://push.exemplo/teste", p256dh: "p".repeat(20), auth: "a".repeat(20) },
    })
    const f = fingir(ENVIADO)
    const agora = new Date()
    expect((await enviarTeste(U, agora, f.enviar)).erro).toBeNull()
    expect(f.chamadas).toHaveLength(1)
    expect((await enviarTeste(U, new Date(agora.getTime() + 5_000), f.enviar)).erro).toMatch(/Aguarde/)
    expect(f.chamadas).toHaveLength(1) // o segundo não saiu
    expect((await enviarTeste(U, new Date(agora.getTime() + 20_000), f.enviar)).erro).toBeNull()
  })

  it("falha na entrega vira mensagem clara", async () => {
    const r = await enviarTeste(ids.f, new Date(Date.now() + 60_000), fingir({ enviadas: 0, removidas: 1, falhas: 0 }).enviar)
    expect(r.erro).toMatch(/Não consegui entregar/)
  })
})
