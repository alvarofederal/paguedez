"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { apagarSerie } from "@/app/_actions/flexoes"

type Serie = { id: string; quantidade: number; feitoEm: Date }

const hora = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
})

export function SeriesHoje({ series }: { series: Serie[] }) {
  const [pendente, iniciar] = useTransition()

  if (series.length === 0) {
    return (
      <p className="adesivo mt-4 p-5 text-center font-bold">
        Nenhuma fleca paga hoje. O sargento está de olho!
      </p>
    )
  }

  const apagar = (id: string, quantidade: number) => {
    if (!confirm(`Apagar a série de ${quantidade} flecas?`)) return
    iniciar(async () => {
      const { erro } = await apagarSerie(id)
      if (erro) toast.error(erro)
      else toast.success("Série apagada")
    })
  }

  return (
    <section className="adesivo mt-4 p-5">
      <h2 className="rotulo mb-2">Séries de hoje</h2>
      <ul className="divide-y divide-black/15">
        {series.map((s) => (
          <li key={s.id} className="flex items-center justify-between py-2.5">
            <span className="text-sm text-[var(--texto-3)]">{hora.format(new Date(s.feitoEm))}</span>
            <span className="flex items-center gap-3">
              <span className="font-bold">{s.quantidade} flecas</span>
              <button
                onClick={() => apagar(s.id, s.quantidade)}
                disabled={pendente}
                className="pilula pilula-fantasma !p-2"
                aria-label={`Apagar série de ${s.quantidade}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
