// Datas do Pague Dez são sempre no horário de Brasília (UTC-3, sem horário de verão desde 2019).
// Um "dia" é guardado como texto "YYYY-MM-DD" para agrupar sem depender do fuso do servidor.

export type TipoPeriodo = "DIARIO" | "SEMANAL" | "MENSAL" | "ANUAL"

export const TIPOS_PERIODO: TipoPeriodo[] = ["DIARIO", "SEMANAL", "MENSAL", "ANUAL"]

const OFFSET_BRASILIA_MS = -3 * 60 * 60 * 1000

export function diaBrasilia(data: Date = new Date()): string {
  return new Date(data.getTime() + OFFSET_BRASILIA_MS).toISOString().slice(0, 10)
}

function paraDataUTC(dia: string): Date {
  return new Date(`${dia}T00:00:00Z`)
}

// Semana ISO (segunda a domingo), ex.: "2026-W41"
export function semanaIso(dia: string): string {
  const data = paraDataUTC(dia)
  const diaSemana = data.getUTCDay() || 7
  data.setUTCDate(data.getUTCDate() + 4 - diaSemana)
  const inicioAno = new Date(Date.UTC(data.getUTCFullYear(), 0, 1))
  const semana = Math.ceil(((data.getTime() - inicioAno.getTime()) / 86_400_000 + 1) / 7)
  return `${data.getUTCFullYear()}-W${String(semana).padStart(2, "0")}`
}

export function chavePeriodo(tipo: TipoPeriodo, dia: string): string {
  switch (tipo) {
    case "DIARIO":
      return dia
    case "SEMANAL":
      return semanaIso(dia)
    case "MENSAL":
      return dia.slice(0, 7)
    case "ANUAL":
      return dia.slice(0, 4)
  }
}

export function somarDias(dia: string, dias: number): string {
  const data = paraDataUTC(dia)
  data.setUTCDate(data.getUTCDate() + dias)
  return data.toISOString().slice(0, 10)
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

export function rotuloPeriodo(tipo: TipoPeriodo | "PRIMEIRA", periodo: string): string {
  switch (tipo) {
    case "DIARIO":
    case "PRIMEIRA": {
      const [ano, mes, d] = periodo.split("-")
      return `${d}/${mes}/${ano}`
    }
    case "SEMANAL": {
      const [ano, semana] = periodo.split("-W")
      return `Semana ${Number(semana)} de ${ano}`
    }
    case "MENSAL": {
      const [ano, mes] = periodo.split("-")
      return `${MESES[Number(mes) - 1]}/${ano}`
    }
    case "ANUAL":
      return periodo
  }
}
