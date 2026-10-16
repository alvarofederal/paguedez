// Amizade é por par: sempre guardada com os ids em ordem (A < B) para não duplicar.
export function parOrdenado(x: string, y: string): [string, string] {
  return x < y ? [x, y] : [y, x]
}
