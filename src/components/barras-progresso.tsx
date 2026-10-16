import type { ItemProgresso } from "@/lib/patentes"

const NUMERO = new Intl.NumberFormat("pt-BR")

/** Uma barra por exigência da próxima patente (flecas válidas, dias pagos, recrutas ativos). */
export function BarrasProgresso({ itens }: { itens: ItemProgresso[] }) {
  return (
    <ul className="space-y-3">
      {itens.map((i) => {
        const pct = i.meta === 0 ? 100 : Math.min(100, Math.floor((i.atual / i.meta) * 100))
        return (
          <li key={i.chave}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="rotulo">{i.rotulo}</span>
              <span className="text-sm font-bold">
                {NUMERO.format(i.atual)} / {NUMERO.format(i.meta)} {i.cumprido && <span aria-label="cumprido">✓</span>}
              </span>
            </div>
            <div className="mt-1 h-3.5 overflow-hidden rounded-full border border-black bg-white" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={i.rotulo}>
              <div className="h-full border-r border-black" style={{ width: `${pct}%`, background: i.cumprido ? "var(--menta)" : "var(--marca)", display: pct === 0 ? "none" : "block" }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
