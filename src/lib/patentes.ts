// Patentes: Recruta → Soldado → Cabo → Sargento → Tenente → Capitão → Major → Coronel → General → Comandante.
// Todas as regras e números vivem AQUI — para ajustar a dificuldade, edite este arquivo.
//
// Como a patente é "à prova de clique à toa":
//  1. Dia pago:   só conta como dia ativo quem pagou pelo menos `minimoDiaPago` flecas naquele dia ("pague dez!").
//  2. Teto diário: no máximo `tetoFlecasPorDia` flecas por dia contam para promoção (o resto vale para recordes, não para patente).
//  3. Constância: cada patente exige um mínimo de DIAS pagos, então não dá para "comprar" patente num dia só.
//  4. Recrutas:   a partir de Sargento é preciso recrutar amigos que ficam ATIVOS (pagaram em `diasPagosDoRecruta` dias).
//  5. Patente nunca desce (guardada no banco), mesmo que depois se desfaça uma série.
// As travas do botão PAGUEI! (intervalo, rajada, teto por série e por dia) continuam valendo por baixo de tudo isso.

export type Patente =
  | "RECRUTA"
  | "SOLDADO"
  | "CABO"
  | "SARGENTO"
  | "TENENTE"
  | "CAPITAO"
  | "MAJOR"
  | "CORONEL"
  | "GENERAL"
  | "COMANDANTE"

export const REGRAS_PATENTE = {
  minimoDiaPago: 10,
  tetoFlecasPorDia: 300,
  diasPagosDoRecruta: 3,
} as const

export type Requisitos = { flecas: number; dias: number; recrutas: number }

export type Simbolo = { tipo: "nenhum" | "divisas" | "estrelas" | "coroa"; n: number }

export type DefinicaoPatente = {
  patente: Patente
  titulo: string
  abreviacao: string
  lema: string
  requisitos: Requisitos
  simbolo: Simbolo
  /** cores do adesivo da insígnia (tokens da paleta, sem o "--") */
  fundo: "nevoa" | "menta" | "eletrico" | "sol" | "lavanda" | "chiclete" | "brasa" | "violeta" | "carbono"
  tinta: "carbono" | "papel" | "sol"
}

export const ESCADA: DefinicaoPatente[] = [
  { patente: "RECRUTA", titulo: "Recruta", abreviacao: "Rec", lema: "Todo grande guerreiro começou aqui.", requisitos: { flecas: 0, dias: 0, recrutas: 0 }, simbolo: { tipo: "nenhum", n: 0 }, fundo: "nevoa", tinta: "carbono" },
  { patente: "SOLDADO", titulo: "Soldado", abreviacao: "Sd", lema: "Apresentou-se e já está pagando.", requisitos: { flecas: 100, dias: 3, recrutas: 0 }, simbolo: { tipo: "divisas", n: 1 }, fundo: "menta", tinta: "carbono" },
  { patente: "CABO", titulo: "Cabo", abreviacao: "Cb", lema: "Já manda em alguém — nas próprias flecas.", requisitos: { flecas: 500, dias: 7, recrutas: 0 }, simbolo: { tipo: "divisas", n: 2 }, fundo: "eletrico", tinta: "carbono" },
  { patente: "SARGENTO", titulo: "Sargento", abreviacao: "Sgt", lema: "Agora é você quem manda pagar dez.", requisitos: { flecas: 1500, dias: 15, recrutas: 1 }, simbolo: { tipo: "divisas", n: 3 }, fundo: "sol", tinta: "carbono" },
  { patente: "TENENTE", titulo: "Tenente", abreviacao: "Ten", lema: "Começa a oficialidade.", requisitos: { flecas: 3000, dias: 30, recrutas: 2 }, simbolo: { tipo: "estrelas", n: 1 }, fundo: "lavanda", tinta: "carbono" },
  { patente: "CAPITAO", titulo: "Capitão", abreviacao: "Cap", lema: "Comanda a companhia.", requisitos: { flecas: 5000, dias: 45, recrutas: 3 }, simbolo: { tipo: "estrelas", n: 2 }, fundo: "chiclete", tinta: "carbono" },
  { patente: "MAJOR", titulo: "Major", abreviacao: "Maj", lema: "Respeito de quartel inteiro.", requisitos: { flecas: 10000, dias: 75, recrutas: 5 }, simbolo: { tipo: "estrelas", n: 3 }, fundo: "brasa", tinta: "papel" },
  { patente: "CORONEL", titulo: "Coronel", abreviacao: "Cel", lema: "Comanda o regimento.", requisitos: { flecas: 20000, dias: 120, recrutas: 8 }, simbolo: { tipo: "estrelas", n: 4 }, fundo: "violeta", tinta: "papel" },
  { patente: "GENERAL", titulo: "General", abreviacao: "Gen", lema: "Estrelas no ombro e flecas nos braços.", requisitos: { flecas: 40000, dias: 200, recrutas: 12 }, simbolo: { tipo: "estrelas", n: 5 }, fundo: "carbono", tinta: "sol" },
  { patente: "COMANDANTE", titulo: "Comandante", abreviacao: "Cmt", lema: "Lenda viva da tropa.", requisitos: { flecas: 100000, dias: 365, recrutas: 20 }, simbolo: { tipo: "coroa", n: 1 }, fundo: "sol", tinta: "carbono" },
]

export const indiceDaPatente = (p: Patente): number => ESCADA.findIndex((d) => d.patente === p)

export type EstatisticasPatente = { flecasValidas: number; diasPagos: number; recrutasAtivos: number }

/** Dias pagos (≥ mínimo) e flecas válidas (com teto por dia) a partir do total de cada dia. */
export function contarDias(totaisPorDia: number[]): { flecasValidas: number; diasPagos: number } {
  let flecasValidas = 0
  let diasPagos = 0
  for (const total of totaisPorDia) {
    flecasValidas += Math.min(total, REGRAS_PATENTE.tetoFlecasPorDia)
    if (total >= REGRAS_PATENTE.minimoDiaPago) diasPagos++
  }
  return { flecasValidas, diasPagos }
}

/** Um recruta conta como "ativo" quando pagou flecas em dias suficientes (impede convidar contas fantasma). */
export function recrutaEstaAtivo(totaisPorDiaDoRecruta: number[]): boolean {
  return contarDias(totaisPorDiaDoRecruta).diasPagos >= REGRAS_PATENTE.diasPagosDoRecruta
}

/** Sem o recurso social (FEATURE_SOCIAL=false) não dá para recrutar: a exigência de recrutas é ignorada. */
function atende(r: Requisitos, s: EstatisticasPatente, exigirRecrutas: boolean): boolean {
  return s.flecasValidas >= r.flecas && s.diasPagos >= r.dias && (!exigirRecrutas || s.recrutasAtivos >= r.recrutas)
}

/** Índice (na ESCADA) da maior patente cujos requisitos TODOS estão cumpridos. */
export function indiceMerecido(s: EstatisticasPatente, exigirRecrutas = true): number {
  let indice = 0
  ESCADA.forEach((d, i) => {
    if (atende(d.requisitos, s, exigirRecrutas)) indice = i
  })
  return indice
}

export type ItemProgresso = { chave: "flecas" | "dias" | "recrutas"; rotulo: string; atual: number; meta: number; cumprido: boolean }

export type ProgressoPatente = {
  proxima: DefinicaoPatente
  itens: ItemProgresso[]
  /** 0–100, média do avanço em cada exigência */
  percentual: number
}

/** O que falta para a patente seguinte (null quando já é Comandante). */
export function progressoParaProxima(s: EstatisticasPatente, indiceAtual: number, exigirRecrutas = true): ProgressoPatente | null {
  const proxima = ESCADA[indiceAtual + 1]
  if (!proxima) return null
  const r = proxima.requisitos

  const itens: ItemProgresso[] = [
    { chave: "flecas", rotulo: "Flecas válidas", atual: Math.min(s.flecasValidas, r.flecas), meta: r.flecas, cumprido: s.flecasValidas >= r.flecas },
    { chave: "dias", rotulo: "Dias pagos", atual: Math.min(s.diasPagos, r.dias), meta: r.dias, cumprido: s.diasPagos >= r.dias },
  ]
  if (exigirRecrutas && r.recrutas > 0) {
    itens.push({ chave: "recrutas", rotulo: "Recrutas ativos", atual: Math.min(s.recrutasAtivos, r.recrutas), meta: r.recrutas, cumprido: s.recrutasAtivos >= r.recrutas })
  }

  const media = itens.reduce((soma, i) => soma + (i.meta === 0 ? 1 : i.atual / i.meta), 0) / itens.length
  return { proxima, itens, percentual: Math.floor(media * 100) }
}
