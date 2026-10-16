// Chave geral do recurso social (convites, amizades, pelotões, emblemas).
// Ligado por padrão; para esconder tudo e voltar ao app "puro", defina FEATURE_SOCIAL=false.
export function socialAtivo(): boolean {
  return process.env.FEATURE_SOCIAL !== "false"
}
