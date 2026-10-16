"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { sairDaComunidadeAction } from "@/app/_actions/social"

export function AcoesMembro({ comunidadeId, nome }: { comunidadeId: string; nome: string }) {
  const [pendente, iniciar] = useTransition()

  const sair = () => {
    if (!confirm(`Sair do pelotão ${nome}?`)) return
    iniciar(async () => {
      const r = await sairDaComunidadeAction(comunidadeId)
      if (r.erro) return void toast.error(r.erro)
      toast.success("Você saiu do pelotão")
      window.location.href = "/comunidades"
    })
  }

  return (
    <section className="mt-10">
      <button onClick={sair} disabled={pendente} className="pilula pilula-fantasma w-full !py-3 text-sm">
        Sair do pelotão
      </button>
    </section>
  )
}
