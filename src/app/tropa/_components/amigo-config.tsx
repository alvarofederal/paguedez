"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { definirVisibilidadeAction, desfazerAmizadeAction } from "@/app/_actions/social"
import { NIVEIS_VISIBILIDADE, type NivelVisibilidade } from "@/lib/visibilidade"

export function AmigoConfig({ amigoId, nome, euMostro, elesMostram }: { amigoId: string; nome: string; euMostro: number; elesMostram: number }) {
  const [nivel, setNivel] = useState(euMostro)
  const [pendente, iniciar] = useTransition()
  const tituloDele = NIVEIS_VISIBILIDADE.find((n) => n.nivel === elesMostram)?.titulo ?? ""

  const mudar = (novo: NivelVisibilidade) =>
    iniciar(async () => {
      const antes = nivel
      setNivel(novo)
      const r = await definirVisibilidadeAction(amigoId, novo)
      if (r.erro) {
        setNivel(antes)
        toast.error(r.erro)
      } else {
        toast.success(`${nome} agora vê: ${NIVEIS_VISIBILIDADE[novo].titulo.toLowerCase()}`)
      }
    })

  const desfazer = () => {
    if (!confirm(`Desfazer a amizade com ${nome}? Vocês deixam de se ver no ranking.`)) return
    iniciar(async () => {
      const r = await desfazerAmizadeAction(amigoId)
      if (r.erro) toast.error(r.erro)
      else toast.success("Amizade desfeita")
    })
  }

  return (
    <li className="adesivo p-4">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/tropa/${amigoId}`} className="min-w-0 truncate font-bold underline-offset-4 hover:underline">
          {nome}
        </Link>
        <button onClick={desfazer} disabled={pendente} className="pilula pilula-fantasma shrink-0 !px-3 !py-1.5 text-xs">
          Desfazer
        </button>
      </div>
      <label className="mt-3 block">
        <span className="rotulo">Eu mostro para {nome.split(" ")[0]}</span>
        <select
          value={nivel}
          disabled={pendente}
          onChange={(e) => mudar(Number(e.target.value) as NivelVisibilidade)}
          className="mt-1.5 w-full rounded-full border border-black bg-white px-4 py-2.5 font-bold outline-none"
        >
          {NIVEIS_VISIBILIDADE.map((n) => (
            <option key={n.nivel} value={n.nivel}>
              {n.titulo}
            </option>
          ))}
        </select>
      </label>
      <p className="mt-2 text-xs text-[var(--texto-3)]">Ele(a) mostra para você: {tituloDele.toLowerCase()}.</p>
    </li>
  )
}
