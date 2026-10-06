import { describe, expect, it } from "vitest"
import { chavePeriodo, diaBrasilia, semanaIso, somarDias } from "@/lib/periodos"
import { avaliarRecordes, resumirPeriodos } from "@/lib/recordes"
import { categoriaTaca, escalaTaca } from "@/lib/tacas"

const porTipo = <T extends { tipo: string }>(lista: T[], tipo: string) => lista.find((x) => x.tipo === tipo)!

describe("periodos", () => {
  it("usa o dia de Brasília, não o UTC", () => {
    // 02:30 UTC de 07/10 ainda é 23:30 de 06/10 em Brasília
    expect(diaBrasilia(new Date("2026-10-07T02:30:00Z"))).toBe("2026-10-06")
    expect(diaBrasilia(new Date("2026-10-07T03:00:00Z"))).toBe("2026-10-07")
  })

  it("calcula a semana ISO (segunda a domingo)", () => {
    expect(semanaIso("2026-10-05")).toBe("2026-W41") // segunda
    expect(semanaIso("2026-10-11")).toBe("2026-W41") // domingo
    expect(semanaIso("2026-10-12")).toBe("2026-W42")
    expect(semanaIso("2027-01-01")).toBe("2026-W53") // virada de ano pertence à semana anterior
  })

  it("gera chaves de período", () => {
    expect(chavePeriodo("DIARIO", "2026-10-06")).toBe("2026-10-06")
    expect(chavePeriodo("MENSAL", "2026-10-06")).toBe("2026-10")
    expect(chavePeriodo("ANUAL", "2026-10-06")).toBe("2026")
    expect(somarDias("2026-10-01", -1)).toBe("2026-09-30")
  })
})

describe("avaliarRecordes", () => {
  it("primeiro dia não bate recorde de período (não há o que bater)", () => {
    const avaliacoes = avaliarRecordes([{ dia: "2026-10-06", quantidade: 10 }], "2026-10-06")
    expect(avaliacoes.every((a) => !a.bateu && a.melhorAnterior === null)).toBe(true)
  })

  it("bate recorde diário quando o total do dia supera o melhor dia anterior", () => {
    const dias = [
      { dia: "2026-10-05", quantidade: 20 },
      { dia: "2026-10-06", quantidade: 10 },
      { dia: "2026-10-06", quantidade: 11 },
    ]
    const diario = porTipo(avaliarRecordes(dias, "2026-10-06"), "DIARIO")
    expect(diario).toMatchObject({ total: 21, melhorAnterior: 20, bateu: true })
  })

  it("empatar não é recorde", () => {
    const dias = [
      { dia: "2026-10-05", quantidade: 20 },
      { dia: "2026-10-06", quantidade: 20 },
    ]
    expect(porTipo(avaliarRecordes(dias, "2026-10-06"), "DIARIO").bateu).toBe(false)
  })

  it("avalia semana, mês e ano somando os dias", () => {
    const dias = [
      { dia: "2026-09-28", quantidade: 30 }, // semana 40, setembro
      { dia: "2026-10-05", quantidade: 20 }, // semana 41, outubro
      { dia: "2026-10-06", quantidade: 15 },
    ]
    const av = avaliarRecordes(dias, "2026-10-06")
    expect(porTipo(av, "SEMANAL")).toMatchObject({ periodo: "2026-W41", total: 35, melhorAnterior: 30, bateu: true })
    expect(porTipo(av, "MENSAL")).toMatchObject({ periodo: "2026-10", total: 35, melhorAnterior: 30, bateu: true })
    expect(porTipo(av, "ANUAL")).toMatchObject({ total: 65, melhorAnterior: null, bateu: false })
    expect(porTipo(av, "DIARIO")).toMatchObject({ total: 15, melhorAnterior: 30, bateu: false })
  })
})

describe("resumirPeriodos", () => {
  it("mostra o atual e o recorde de cada período", () => {
    const dias = [
      { dia: "2026-10-01", quantidade: 40 },
      { dia: "2026-10-06", quantidade: 12 },
    ]
    const diario = porTipo(resumirPeriodos(dias, "2026-10-06"), "DIARIO")
    expect(diario).toEqual({ tipo: "DIARIO", atual: 12, recorde: 40, periodoRecorde: "2026-10-01" })
  })
})

describe("tacas", () => {
  it("cada nova taça é igual ou maior que a anterior", () => {
    for (let n = 1; n < 40; n++) expect(escalaTaca(n + 1)).toBeGreaterThanOrEqual(escalaTaca(n))
    expect(escalaTaca(1)).toBe(1)
  })

  it("sobe de categoria com o nível e com períodos mais longos", () => {
    expect(categoriaTaca(1, "PRIMEIRA").nome).toBe("Bronze")
    expect(categoriaTaca(8, "DIARIO").nome).toBe("Ouro")
    expect(categoriaTaca(2, "ANUAL").nome).toBe("Platina")
    expect(categoriaTaca(30, "DIARIO").nome).toBe("Lendária")
  })
})
