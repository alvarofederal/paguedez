import { describe, expect, it } from "vitest"
import {
  agoraEmBrasilia, alternarDia, avaliarLembrete, horaValida, indiceDiaSemana, mascaraValida, minutosDeHora, montarMensagem,
  naJanela, ordenarPorHora, temDia, TODOS_OS_DIAS,
} from "@/lib/lembretes"

const lembrete = { hora: "19:00", diasSemana: TODOS_OS_DIAS, somenteSePendente: true, ativo: true }
const agora = (dia: string, hhmm: string) => ({ dia, minutos: minutosDeHora(hhmm) })
const livre = { jaProcessadoHoje: false, jaPagouHoje: false }

describe("horários e dias", () => {
  it("valida HH:MM", () => {
    for (const ok of ["00:00", "07:05", "19:30", "23:59"]) expect(horaValida(ok)).toBe(true)
    for (const ruim of ["24:00", "7:00", "19:60", "abc", "", "19:0"]) expect(horaValida(ruim)).toBe(false)
  })

  it("dia da semana: 0 = segunda ... 6 = domingo", () => {
    expect(indiceDiaSemana("2026-10-19")).toBe(0) // segunda
    expect(indiceDiaSemana("2026-10-22")).toBe(3) // quinta
    expect(indiceDiaSemana("2026-10-25")).toBe(6) // domingo
  })

  it("máscara de dias", () => {
    expect(mascaraValida(0)).toBe(false)
    expect(mascaraValida(128)).toBe(false)
    expect(mascaraValida(127)).toBe(true)
    const semDomingo = alternarDia(TODOS_OS_DIAS, 6)
    expect(temDia(semDomingo, 6)).toBe(false)
    expect(temDia(semDomingo, 0)).toBe(true)
    expect(alternarDia(semDomingo, 6)).toBe(TODOS_OS_DIAS)
  })

  it("converte para o horário de Brasília (UTC-3)", () => {
    expect(agoraEmBrasilia(new Date("2026-10-22T22:30:00Z"))).toEqual({ dia: "2026-10-22", minutos: 19 * 60 + 30 })
    // 01:00 UTC ainda é "ontem" à noite em Brasília
    expect(agoraEmBrasilia(new Date("2026-10-23T01:00:00Z"))).toEqual({ dia: "2026-10-22", minutos: 22 * 60 })
  })
})

describe("quando o lembrete dispara", () => {
  it("antes do horário espera; no horário e dentro da tolerância envia", () => {
    expect(avaliarLembrete(lembrete, agora("2026-10-22", "18:59"), livre, 120)).toBe("AINDA_NAO")
    expect(avaliarLembrete(lembrete, agora("2026-10-22", "19:00"), livre, 120)).toBe("ENVIAR")
    expect(avaliarLembrete(lembrete, agora("2026-10-22", "20:30"), livre, 120)).toBe("ENVIAR") // agendador atrasado, ainda vale
    expect(avaliarLembrete(lembrete, agora("2026-10-22", "21:00"), livre, 120)).toBe("ENVIAR") // limite exato
  })

  it("passou da tolerância: não manda lembrete velho", () => {
    expect(avaliarLembrete(lembrete, agora("2026-10-22", "21:01"), livre, 120)).toBe("PERDEU_JANELA")
    expect(avaliarLembrete(lembrete, agora("2026-10-22", "23:50"), livre, 120)).toBe("PERDEU_JANELA")
  })

  it("não repete no mesmo dia", () => {
    expect(avaliarLembrete(lembrete, agora("2026-10-22", "19:05"), { ...livre, jaProcessadoHoje: true }, 120)).toBe("JA_PROCESSADO")
  })

  it("só avisa quem ainda não pagou (quando configurado assim)", () => {
    const pago = { jaProcessadoHoje: false, jaPagouHoje: true }
    expect(avaliarLembrete(lembrete, agora("2026-10-22", "19:05"), pago, 120)).toBe("JA_PAGOU")
    expect(avaliarLembrete({ ...lembrete, somenteSePendente: false }, agora("2026-10-22", "19:05"), pago, 120)).toBe("ENVIAR")
  })

  it("respeita os dias da semana e o interruptor", () => {
    const semDomingo = { ...lembrete, diasSemana: alternarDia(TODOS_OS_DIAS, 6) }
    expect(avaliarLembrete(semDomingo, agora("2026-10-25", "19:05"), livre, 120)).toBe("FORA_DO_DIA") // domingo
    expect(avaliarLembrete(semDomingo, agora("2026-10-24", "19:05"), livre, 120)).toBe("ENVIAR") // sábado
    expect(avaliarLembrete({ ...lembrete, ativo: false }, agora("2026-10-22", "19:05"), livre, 120)).toBe("INATIVO")
  })

  it("o filtro barato não consulta nada além do relógio", () => {
    expect(naJanela(lembrete, agora("2026-10-22", "19:30"), 120)).toBe("SIM")
    expect(naJanela(lembrete, agora("2026-10-22", "08:00"), 120)).toBe("AINDA_NAO")
  })
})

describe("mensagem", () => {
  it("sem flecas hoje: cobra, com variações por semente", () => {
    const a = montarMensagem({ totalHoje: 0, recordeDiario: 40, semente: 0 })
    const b = montarMensagem({ totalHoje: 0, recordeDiario: 40, semente: 1 })
    expect(a.corpo).not.toBe(b.corpo)
    expect(a).toMatchObject({ titulo: "Pague Dez", url: "/", tag: "lembrete-pague-dez" })
  })

  it("trata pela patente e mantém a frase correta", () => {
    expect(montarMensagem({ totalHoje: 0, recordeDiario: 0, semente: 0, tratamento: "Cabo" }).corpo).toBe("Cabo, você ainda não pagou nenhuma fleca hoje. Que tal dez agora?")
  })

  it("com flecas: mostra quanto falta para o recorde ou incentiva a ir além", () => {
    expect(montarMensagem({ totalHoje: 30, recordeDiario: 50, semente: 0 }).corpo).toBe("Hoje você já pagou 30. Faltam 21 para bater o seu recorde diário.")
    expect(montarMensagem({ totalHoje: 60, recordeDiario: 50, semente: 0 }).corpo).toBe("Hoje você já pagou 60. Quer ir além?")
  })
})

describe("agenda", () => {
  it("ordena por horário", () => {
    expect(ordenarPorHora([{ hora: "19:00" }, { hora: "07:30" }, { hora: "12:00" }]).map((x) => x.hora)).toEqual(["07:30", "12:00", "19:00"])
  })
})
