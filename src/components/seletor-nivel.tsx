"use client"

import { NIVEIS_VISIBILIDADE, type NivelVisibilidade } from "@/lib/visibilidade"

// Os 3 níveis de visibilidade como cartões de escolha (radio). Usado no aceite do convite,
// na criação/edição do pelotão (o DONO decide) e nas configurações de amigo.
export function SeletorNivel({
  valor,
  aoMudar,
  desabilitado,
}: {
  valor: NivelVisibilidade
  aoMudar: (nivel: NivelVisibilidade) => void
  desabilitado?: boolean
}) {
  return (
    <div role="radiogroup" className="space-y-2">
      {NIVEIS_VISIBILIDADE.map((n) => {
        const ativo = valor === n.nivel
        return (
          <button
            key={n.nivel}
            type="button"
            role="radio"
            aria-checked={ativo}
            disabled={desabilitado}
            onClick={() => aoMudar(n.nivel)}
            className={`w-full rounded-[20px] border border-black p-3 text-left transition disabled:opacity-60 ${ativo ? "bg-[var(--sol)]" : "bg-white hover:bg-[var(--nevoa)]"}`}
          >
            <span className="flex items-center gap-2 font-bold">
              <span className={`h-4 w-4 shrink-0 rounded-full border border-black ${ativo ? "bg-black" : "bg-white"}`} />
              {n.titulo}
            </span>
            <span className="mt-1 block pl-6 text-sm">{n.descricao}</span>
          </button>
        )
      })}
    </div>
  )
}
