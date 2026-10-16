import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
vi.mock("server-only", () => ({}))
import prisma from "@/lib/prisma"
import { patentesDe, sincronizarPatente } from "@/server/patentes"

const tag = `pat${Date.now()}`
let U: string // usuário que sobe de patente
let R: string // recruta convidado por U

const dias = (qtd: number, por: number, prefixo = "2026-03-") =>
  Array.from({ length: qtd }, (_, i) => ({ dia: `${prefixo}${String(i + 1).padStart(2, "0")}`, quantidade: por }))

async function registrar(userId: string, linhas: { dia: string; quantidade: number }[]) {
  await prisma.registro.createMany({ data: linhas.map((l) => ({ userId, quantidade: l.quantidade, dia: l.dia })) })
}

beforeAll(async () => {
  U = (await prisma.user.create({ data: { name: "Patente Teste", email: `${tag}.u@paguedez.test`, password: "x", sexo: "MASCULINO" } })).id
  R = (await prisma.user.create({ data: { name: "Recruta Teste", email: `${tag}.r@paguedez.test`, password: "x", sexo: "MASCULINO" } })).id
})

afterAll(async () => {
  const ids = [U, R]
  await prisma.patenteConquistada.deleteMany({ where: { userId: { in: ids } } })
  await prisma.convite.deleteMany({ where: { convidanteId: { in: ids } } })
  await prisma.registro.deleteMany({ where: { userId: { in: ids } } })
  await prisma.user.deleteMany({ where: { id: { in: ids } } })
  await prisma.$disconnect()
})

describe("patentes no banco", () => {
  it("todo mundo começa Recruta (sem festa) e vê o que falta para Soldado", async () => {
    const s = await sincronizarPatente(U)
    expect(s.atual.patente).toBe("RECRUTA")
    expect(s.novas.map((p) => p.patente)).toEqual(["RECRUTA"])
    expect(s.progresso?.proxima.patente).toBe("SOLDADO")
    expect((await sincronizarPatente(U)).novas).toEqual([]) // idempotente
  })

  it("promove a Soldado com 100 flecas válidas em 3 dias pagos e comemora uma única vez", async () => {
    await registrar(U, dias(3, 40)) // 120 flecas, 3 dias de 40
    const s = await sincronizarPatente(U)
    expect(s.atual.patente).toBe("SOLDADO")
    expect(s.novas.map((p) => p.patente)).toEqual(["SOLDADO"])
    expect(s.stats).toMatchObject({ flecasValidas: 120, diasPagos: 3 })
    expect((await sincronizarPatente(U)).novas).toEqual([])
  })

  it("clicar demais num dia só: o teto diário limita o que conta", async () => {
    await registrar(U, [{ dia: "2026-04-01", quantidade: 1000 }])
    const s = await sincronizarPatente(U)
    expect(s.stats.flecasValidas).toBe(120 + 300) // 1000 num dia contam só 300
    expect(s.stats.diasPagos).toBe(4)
    expect(s.atual.patente).toBe("SOLDADO") // 420 flecas / 4 dias: ainda não é Cabo (500 / 7 dias)
  })

  it("dia com menos de 10 flecas não conta como dia pago", async () => {
    await registrar(U, [{ dia: "2026-04-02", quantidade: 9 }])
    expect((await sincronizarPatente(U)).stats.diasPagos).toBe(4)
  })

  it("a patente nunca desce, mesmo se as flecas forem apagadas", async () => {
    await prisma.registro.deleteMany({ where: { userId: U } })
    const s = await sincronizarPatente(U)
    expect(s.stats.flecasValidas).toBe(0)
    expect(s.atual.patente).toBe("SOLDADO")
    expect(s.novas).toEqual([])
  })

  it("recruta só conta como ativo depois de pagar em 3 dias", async () => {
    await prisma.convite.create({
      data: {
        convidanteId: U, apelido: "R", telefoneHmac: `h${tag}`, telefoneMascara: "(11) 9****-0000", tokenHash: `t${tag}`,
        status: "ACEITO", expiraEm: new Date(Date.now() + 1e9), aceitoPorId: R, aceitoEm: new Date(),
      },
    })
    await registrar(R, dias(2, 50))
    expect((await sincronizarPatente(U)).stats.recrutasAtivos).toBe(0) // 2 dias: ainda não
    await registrar(R, [{ dia: "2026-03-20", quantidade: 50 }])
    expect((await sincronizarPatente(U)).stats.recrutasAtivos).toBe(1)

    await prisma.user.update({ where: { id: R }, data: { ativo: false } })
    expect((await sincronizarPatente(U)).stats.recrutasAtivos).toBe(0) // conta desativada não conta
    await prisma.user.update({ where: { id: R }, data: { ativo: true } })
  })

  it("Sargento exige recruta ativo: sem ele, para em Cabo", async () => {
    await prisma.convite.deleteMany({ where: { convidanteId: U } })
    await registrar(U, dias(15, 100, "2026-05-")) // 1500 flecas, 15 dias (teto 300/dia não limita 100/dia)
    const sem = await sincronizarPatente(U)
    expect(sem.atual.patente).toBe("CABO")
    expect(sem.progresso?.itens.find((i) => i.chave === "recrutas")).toMatchObject({ atual: 0, meta: 1 })

    await prisma.convite.create({
      data: {
        convidanteId: U, apelido: "R", telefoneHmac: `h2${tag}`, telefoneMascara: "(11) 9****-1111", tokenHash: `t2${tag}`,
        status: "ACEITO", expiraEm: new Date(Date.now() + 1e9), aceitoPorId: R, aceitoEm: new Date(),
      },
    })
    const com = await sincronizarPatente(U)
    expect(com.atual.patente).toBe("SARGENTO")
    expect(com.novas.map((p) => p.patente)).toEqual(["SARGENTO"])
  })

  it("patentesDe devolve a mais alta de cada um e Recruta para quem nunca foi sincronizado", async () => {
    const mapa = await patentesDe([U, R])
    expect(mapa[U]).toBe("SARGENTO")
    expect(mapa[R]).toBe("RECRUTA")
  })
})
