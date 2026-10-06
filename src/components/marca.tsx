// Selo circular "10" + nome. Versão "lg" é o bloco display empilhado das telas de acesso.
export function Marca({ tamanho = "md" }: { tamanho?: "md" | "lg" }) {
  if (tamanho === "lg") {
    return (
      <span className="display block text-[88px] select-none sm:text-[120px]" aria-label="Pague Dez">
        <span className="block">Pague</span>
        <span className="block">Dez</span>
      </span>
    )
  }

  return (
    <span className="flex items-center gap-2 select-none">
      <span className="display flex h-10 w-10 items-center justify-center rounded-full border border-black bg-white text-lg leading-none">
        10
      </span>
      <span className="display text-2xl">Pague Dez</span>
    </span>
  )
}
