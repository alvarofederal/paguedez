import { describe, expect, it } from "vitest"
import { avaliarLimites, formatarEspera, LIMITES } from "@/lib/limites"

const base = new Date("2026-10-06T15:00:00Z")
const antes = (seg: number, quantidade = 10) => ({ quantidade, feitoEm: new Date(base.getTime() - seg * 1000) })

describe("avaliarLimites", () => {
  it("libera o primeiro registro do dia", () => {
    expect(avaliarLimites(10, [], base)).toEqual({ ok: true })
  })

  it("barra duplo clique (intervalo mínimo) e diz quanto esperar", () => {
    const r = avaliarLimites(10, [antes(3)], base)
    expect(r).toMatchObject({ ok: false, motivo: "INTERVALO", esperarSegundos: LIMITES.intervaloMinimoSeg - 3 })
  })

  it("permite dois registros espaçados dentro da janela", () => {
    expect(avaliarLimites(10, [antes(60)], base)).toEqual({ ok: true })
  })

  it("barra o terceiro registro dentro da janela (rajada)", () => {
    const r = avaliarLimites(10, [antes(30), antes(90)], base)
    expect(r).toMatchObject({ ok: false, motivo: "JANELA" })
    // libera quando o registro mais antigo sair da janela
    expect(r.ok === false && r.esperarSegundos).toBe(LIMITES.janelaSeg - 90)
  })

  it("libera de novo depois que a janela passa", () => {
    expect(avaliarLimites(10, [antes(LIMITES.janelaSeg + 5), antes(LIMITES.janelaSeg + 60)], base)).toEqual({ ok: true })
  })

  it("rejeita série acima do teto, mesmo sendo o primeiro registro", () => {
    expect(avaliarLimites(LIMITES.maxPorSerie + 1, [], base)).toMatchObject({ ok: false, motivo: "SERIE_GRANDE" })
    expect(avaliarLimites(LIMITES.maxPorSerie, [], base)).toEqual({ ok: true })
  })

  it("barra quando o total do dia passaria do limite", () => {
    const hoje = [antes(4000, 400), antes(5000, 400), antes(6000, 150)] // 950 no dia, todos fora da janela
    expect(avaliarLimites(60, hoje, base)).toMatchObject({ ok: false, motivo: "LIMITE_DIA" })
    expect(avaliarLimites(50, hoje, base)).toEqual({ ok: true })
  })

  it("barra quando passa do número de registros no dia", () => {
    const hoje = Array.from({ length: LIMITES.maxRegistrosDia }, (_, i) => antes(1000 + i * 1000, 1))
    expect(avaliarLimites(1, hoje, base)).toMatchObject({ ok: false, motivo: "LIMITE_DIA" })
  })

  it("não depende da ordem dos registros recebidos", () => {
    const r = avaliarLimites(10, [antes(90), antes(5), antes(30)], base)
    expect(r).toMatchObject({ ok: false, motivo: "INTERVALO" })
  })
})

describe("formatarEspera", () => {
  it("formata segundos e minutos", () => {
    expect(formatarEspera(45)).toBe("45s")
    expect(formatarEspera(120)).toBe("2min")
    expect(formatarEspera(95)).toBe("1min 35s")
  })
})
