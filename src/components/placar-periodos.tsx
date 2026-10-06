import type { ResumoPeriodo } from "@/lib/recordes"
import { rotuloPeriodo, type TipoPeriodo } from "@/lib/periodos"

// Cada período é um adesivo de uma cor da paleta; "Hoje" usa a cor do tema (azul/rosa)
const ESTILO: Record<TipoPeriodo, { rotulo: string; fundo: string; giro: string }> = {
  DIARIO: { rotulo: "Hoje", fundo: "var(--marca)", giro: "-rotate-1" },
  SEMANAL: { rotulo: "Semana", fundo: "var(--menta)", giro: "rotate-1" },
  MENSAL: { rotulo: "Mês", fundo: "var(--lavanda)", giro: "rotate-1" },
  ANUAL: { rotulo: "Ano", fundo: "var(--sol)", giro: "-rotate-1" },
}

export function PlacarPeriodos({ resumo, mostrarPeriodo = false }: { resumo: ResumoPeriodo[]; mostrarPeriodo?: boolean }) {
  return (
    <section className="grid grid-cols-2 gap-3">
      {resumo.map((r) => {
        const estilo = ESTILO[r.tipo]
        const noRecorde = r.atual > 0 && r.atual >= r.recorde
        return (
          <div
            key={r.tipo}
            className={`rounded-[20px] border border-black p-4 ${estilo.giro}`}
            style={{ background: estilo.fundo }}
          >
            <p className="rotulo">{estilo.rotulo}</p>
            <p className="display mt-2 text-[52px]">{r.atual}</p>
            <p className="mt-2 inline-block rounded-full border border-black bg-white px-2.5 py-0.5 text-xs font-bold">
              {noRecorde ? "★ No recorde!" : `Recorde: ${r.recorde}`}
            </p>
            {mostrarPeriodo && r.periodoRecorde && (
              <p className="mt-1.5 text-xs">{rotuloPeriodo(r.tipo, r.periodoRecorde)}</p>
            )}
          </div>
        )
      })}
    </section>
  )
}
