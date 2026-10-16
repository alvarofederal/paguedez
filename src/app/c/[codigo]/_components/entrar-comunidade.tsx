"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { entrarPorCodigoAction } from "@/app/_actions/social"

export function EntrarComunidade({ codigo, nome }: { codigo: string; nome: string }) {
  const [enviando, setEnviando] = useState(false)

  const entrar = async () => {
    setEnviando(true)
    const r = await entrarPorCodigoAction(codigo)
    if (r.erro !== null || !("id" in r)) {
      toast.error(r.erro ?? "Não foi possível entrar")
      setEnviando(false)
      return
    }
    toast.success(`Você entrou no pelotão ${nome}!`)
    window.location.href = `/comunidades/${r.id}`
  }

  return (
    <button onClick={entrar} disabled={enviando} className="pilula pilula-cheia w-full !py-4 text-base">
      {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
      Entrar no pelotão
    </button>
  )
}
