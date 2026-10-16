"use client"

import { useState } from "react"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { criarComunidadeAction } from "@/app/_actions/social"
import { CamposComunidade, type EstadoComunidade } from "@/components/campos-comunidade"

const INICIAL: EstadoComunidade = { nome: "", descricao: "", cor: "menta", nivel: 0 }

export function NovaComunidade() {
  const [aberto, setAberto] = useState(false)
  const [estado, setEstado] = useState<EstadoComunidade>(INICIAL)
  const [enviando, setEnviando] = useState(false)

  if (!aberto) {
    return (
      <button onClick={() => setAberto(true)} className="pilula pilula-cheia w-full !py-4 text-base">
        <Plus className="h-5 w-5" /> Criar um pelotão
      </button>
    )
  }

  const criar = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnviando(true)
    const r = await criarComunidadeAction({ nome: estado.nome, descricao: estado.descricao || undefined, cor: estado.cor, nivelVisibilidade: estado.nivel })
    if (r.erro !== null || !("id" in r)) {
      toast.error(r.erro ?? "Não foi possível criar o pelotão")
      setEnviando(false)
      return
    }
    toast.success("Pelotão criado! Agora convide a tropa.")
    window.location.href = `/comunidades/${r.id}`
  }

  return (
    <form onSubmit={criar} className="adesivo-grande space-y-4 bg-white p-5">
      <CamposComunidade valor={estado} aoMudar={setEstado} desabilitado={enviando} />
      <div className="flex gap-2">
        <button type="button" onClick={() => setAberto(false)} disabled={enviando} className="pilula pilula-fantasma flex-1 !py-4">
          Cancelar
        </button>
        <button type="submit" disabled={enviando} className="pilula pilula-cheia flex-1 !py-4">
          {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : "Criar pelotão"}
        </button>
      </div>
    </form>
  )
}
