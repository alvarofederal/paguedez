// O que uma pessoa mostra para outra (amigo) ou para os membros de um pelotão.
// Na COMUNIDADE quem decide é o DONO (vale para todos os membros).
// Entre AMIGOS cada lado decide o que mostra ao outro.

export type NivelVisibilidade = 0 | 1 | 2

export const NIVEIS_VISIBILIDADE: { nivel: NivelVisibilidade; titulo: string; descricao: string }[] = [
  { nivel: 0, titulo: "Só o ranking", descricao: "Posição e total de flecas no período." },
  { nivel: 1, titulo: "Ranking + recordes e taças", descricao: "Também os recordes atuais e as taças conquistadas." },
  { nivel: 2, titulo: "Tudo", descricao: "Também as séries do dia e o gráfico dos últimos 30 dias." },
]

export function nivelValido(valor: unknown): valor is NivelVisibilidade {
  return valor === 0 || valor === 1 || valor === 2
}

export const podeVerRecordes = (nivel: number) => nivel >= 1
export const podeVerDetalhes = (nivel: number) => nivel >= 2
