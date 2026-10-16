// Emblemas (badges) conquistados. As regras são puras: recebem estatísticas e dizem o que é merecido.
// Para criar um emblema novo: adicione aqui e em `enum TipoEmblema` no schema.

export type TipoEmblema = "RECRUTA" | "RECRUTADOR" | "COMANDANTE" | "PERSISTENTE" | "CENTENARIO"

export type EstatisticasEmblemas = {
  temTacaRecruta: boolean
  convitesAceitos: number
  comunidadesCriadas: number
  diasComFlecas: number
  totalFlecas: number
}

export type DefinicaoEmblema = {
  tipo: TipoEmblema
  titulo: string
  descricao: string
  como: string
  /** nome da paleta de adesivos (token CSS --<cor>) */
  cor: "sol" | "menta" | "lavanda" | "brasa" | "violeta" | "eletrico"
  icone: "shield" | "megaphone" | "flag" | "flame" | "target"
  merecido: (s: EstatisticasEmblemas) => boolean
}

export const CATALOGO_EMBLEMAS: DefinicaoEmblema[] = [
  {
    tipo: "RECRUTA",
    titulo: "Recruta",
    descricao: "Pagou a primeira fleca. Todo guerreiro começa aqui.",
    como: "Registre sua primeira série.",
    cor: "sol",
    icone: "shield",
    merecido: (s) => s.temTacaRecruta,
  },
  {
    tipo: "RECRUTADOR",
    titulo: "Recrutador",
    descricao: "Trouxe um amigo para a tropa. Soldado que recruta é soldado de respeito.",
    como: "Convide um amigo que aceite o convite.",
    cor: "menta",
    icone: "megaphone",
    merecido: (s) => s.convitesAceitos >= 1,
  },
  {
    tipo: "COMANDANTE",
    titulo: "Comandante",
    descricao: "Montou o próprio pelotão e assumiu o comando.",
    como: "Crie uma Comunidade de Pagação.",
    cor: "violeta",
    icone: "flag",
    merecido: (s) => s.comunidadesCriadas >= 1,
  },
  {
    tipo: "PERSISTENTE",
    titulo: "Persistente",
    descricao: "Sete dias diferentes pagando flecas. Constância é o que vence.",
    como: "Pague flecas em 7 dias diferentes.",
    cor: "brasa",
    icone: "flame",
    merecido: (s) => s.diasComFlecas >= 7,
  },
  {
    tipo: "CENTENARIO",
    titulo: "Centenário",
    descricao: "Cem flecas somadas. A conta está só começando.",
    como: "Some 100 flecas no total.",
    cor: "lavanda",
    icone: "target",
    merecido: (s) => s.totalFlecas >= 100,
  },
]

export function emblemasMerecidos(s: EstatisticasEmblemas): TipoEmblema[] {
  return CATALOGO_EMBLEMAS.filter((e) => e.merecido(s)).map((e) => e.tipo)
}
