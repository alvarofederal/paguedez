import { describe, expect, it } from "vitest"
import { contarDias, ESCADA, indiceDaPatente, indiceMerecido, progressoParaProxima, recrutaEstaAtivo, REGRAS_PATENTE } from "@/lib/patentes"

const stats = (flecasValidas: number, diasPagos: number, recrutasAtivos = 0) => ({ flecasValidas, diasPagos, recrutasAtivos })

describe("escada de patentes", () => {
  it("tem as 10 patentes na ordem pedida e os requisitos só crescem", () => {
    expect(ESCADA.map((d) => d.patente)).toEqual([
      "RECRUTA", "SOLDADO", "CABO", "SARGENTO", "TENENTE", "CAPITAO", "MAJOR", "CORONEL", "GENERAL", "COMANDANTE",
    ])
    for (let i = 1; i < ESCADA.length; i++) {
      const a = ESCADA[i - 1].requisitos
      const b = ESCADA[i].requisitos
      expect(b.flecas).toBeGreaterThan(a.flecas)
      expect(b.dias).toBeGreaterThan(a.dias)
      expect(b.recrutas).toBeGreaterThanOrEqual(a.recrutas)
    }
    expect(indiceDaPatente("COMANDANTE")).toBe(9)
  })

  it("com o teto diário, cada patente leva pelo menos os dias exigidos (não dá para queimar etapas)", () => {
    for (const d of ESCADA) {
      // mesmo no ritmo máximo contável (teto/dia), os dias exigidos nunca são menos que os necessários para juntar as flecas
      expect(d.requisitos.dias).toBeGreaterThanOrEqual(Math.ceil(d.requisitos.flecas / REGRAS_PATENTE.tetoFlecasPorDia))
    }
  })
})

describe("contarDias (garantia de que pagou)", () => {
  it("só conta como dia pago quem fez pelo menos 10 flecas", () => {
    expect(contarDias([9, 10, 0, 50]).diasPagos).toBe(2)
  })

  it("aplica o teto diário às flecas válidas", () => {
    expect(contarDias([1000, 200]).flecasValidas).toBe(REGRAS_PATENTE.tetoFlecasPorDia + 200)
  })

  it("clicar muito num dia só não vira patente", () => {
    const um_dia_so = contarDias([1000])
    expect(um_dia_so).toEqual({ flecasValidas: 300, diasPagos: 1 })
    expect(indiceMerecido({ ...um_dia_so, recrutasAtivos: 0 })).toBe(0) // continua Recruta
  })
})

describe("indiceMerecido", () => {
  it("todos os requisitos precisam estar cumpridos", () => {
    expect(indiceMerecido(stats(0, 0))).toBe(0)
    expect(indiceMerecido(stats(100, 3))).toBe(1) // Soldado
    expect(indiceMerecido(stats(100, 2))).toBe(0) // flecas ok, faltam dias
    expect(indiceMerecido(stats(5000, 2))).toBe(0) // muitas flecas, poucos dias: continua Recruta
  })

  it("flecas demais sem constância não promovem", () => {
    // 500 flecas mas só 2 dias pagos: nem Soldado (exige 3 dias)
    expect(indiceMerecido(stats(500, 2))).toBe(0)
    // 500 flecas e 7 dias: Cabo
    expect(indiceMerecido(stats(500, 7))).toBe(2)
  })

  it("de Sargento em diante exige recrutas ativos", () => {
    expect(indiceMerecido(stats(1500, 15, 0))).toBe(2) // parado em Cabo
    expect(indiceMerecido(stats(1500, 15, 1))).toBe(3) // Sargento
    expect(indiceMerecido(stats(100000, 365, 19))).toBe(8) // General
    expect(indiceMerecido(stats(100000, 365, 20))).toBe(9) // Comandante
  })

  it("sem o recurso social a exigência de recrutas é ignorada", () => {
    expect(indiceMerecido(stats(100000, 365, 0), false)).toBe(9)
  })
})

describe("recrutaEstaAtivo", () => {
  it("só conta quem pagou em pelo menos 3 dias", () => {
    expect(recrutaEstaAtivo([10, 10])).toBe(false)
    expect(recrutaEstaAtivo([10, 10, 10])).toBe(true)
    expect(recrutaEstaAtivo([5, 5, 5, 5])).toBe(false) // dias com menos de 10 não contam
    expect(recrutaEstaAtivo([500])).toBe(false) // um dia só nunca basta
  })
})

describe("progressoParaProxima", () => {
  it("mostra o que falta e o percentual", () => {
    const p = progressoParaProxima(stats(50, 1), 0)!
    expect(p.proxima.patente).toBe("SOLDADO")
    expect(p.itens.map((i) => [i.chave, i.atual, i.meta, i.cumprido])).toEqual([
      ["flecas", 50, 100, false],
      ["dias", 1, 3, false],
    ])
    expect(p.percentual).toBe(Math.floor(((50 / 100 + 1 / 3) / 2) * 100))
  })

  it("inclui recrutas quando a próxima patente exige", () => {
    const p = progressoParaProxima(stats(1500, 15, 0), 2)!
    expect(p.proxima.patente).toBe("SARGENTO")
    expect(p.itens.find((i) => i.chave === "recrutas")).toMatchObject({ atual: 0, meta: 1, cumprido: false })
  })

  it("não mostra recrutas quando o social está desligado", () => {
    expect(progressoParaProxima(stats(1500, 15, 0), 2, false)!.itens.map((i) => i.chave)).toEqual(["flecas", "dias"])
  })

  it("no topo da escada não há próxima", () => {
    expect(progressoParaProxima(stats(999999, 999, 99), 9)).toBeNull()
  })
})
