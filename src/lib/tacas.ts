// Cada taça nova é maior e mais nobre que a anterior.
// "nivel" é o número sequencial da conquista do usuário (1ª, 2ª, 3ª...).
// Recordes de períodos longos valem mais pontos de nobreza.

export type TipoTaca = "PRIMEIRA" | "DIARIO" | "SEMANAL" | "MENSAL" | "ANUAL"

// Estilo adesivo: cores chapadas (sem gradiente), contorno preto.
export type CategoriaTaca = {
  nome: string
  indice: number // 0 = Bronze ... 5 = Lendária
  cor: string // corpo da taça
  sombra: string // meia-face chapada que dá volume sem gradiente
  selo: string | null // estrela-adesivo atrás da taça (null = sem selo)
}

const CATEGORIAS: Omit<CategoriaTaca, "indice">[] = [
  { nome: "Bronze", cor: "#e9934a", sombra: "#c06a24", selo: null },
  { nome: "Prata", cor: "#e4e8ee", sombra: "#aeb6c2", selo: "#e9ccff" },
  { nome: "Ouro", cor: "#ffd731", sombra: "#e0a800", selo: "#55db9c" },
  { nome: "Platina", cor: "#a6f0dd", sombra: "#55c4a6", selo: "#fb4903" },
  { nome: "Diamante", cor: "#9fd0ff", sombra: "#4da2ff", selo: "#ffd731" },
  { nome: "Lendária", cor: "#8f7cff", sombra: "#5c4ade", selo: "#fb4903" },
]

const BONUS_TIPO: Record<TipoTaca, number> = {
  PRIMEIRA: 0,
  DIARIO: 0,
  SEMANAL: 3,
  MENSAL: 6,
  ANUAL: 10,
}

const LIMIARES = [0, 3, 7, 12, 18, 26] // pontos mínimos de cada categoria

export const NOME_TIPO_TACA: Record<TipoTaca, string> = {
  PRIMEIRA: "Recruta",
  DIARIO: "Recorde diário",
  SEMANAL: "Recorde semanal",
  MENSAL: "Recorde mensal",
  ANUAL: "Recorde anual",
}

export function categoriaTaca(nivel: number, tipo: TipoTaca): CategoriaTaca {
  const pontos = nivel + BONUS_TIPO[tipo]
  let indice = 0
  LIMIARES.forEach((limiar, i) => {
    if (pontos >= limiar) indice = i
  })
  return { ...CATEGORIAS[indice], indice }
}

// Escala visual: cresce a cada conquista, com teto para não estourar a tela.
export function escalaTaca(nivel: number): number {
  return Math.min(1 + (nivel - 1) * 0.06, 2)
}
