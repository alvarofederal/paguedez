"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { aceitarConviteAction } from "@/app/_actions/social"
import { SeletorNivel } from "@/components/seletor-nivel"
import type { NivelVisibilidade } from "@/lib/visibilidade"

export function AceitarConvite({ token, convidanteNome, pelotao }: { token: string; convidanteNome: string; pelotao: string | null }) {
  const [nivel, setNivel] = useState<NivelVisibilidade>(0)
  const [enviando, setEnviando] = useState(false)

  const aceitar = async () => {
    setEnviando(true)
    const r = await aceitarConviteAction(token, nivel)
    if (r.erro !== null) {
      toast.error(r.erro)
      setEnviando(false)
      return
    }
    toast.success(pelotao ? `Você entrou no pelotão ${pelotao}!` : `Agora você e ${convidanteNome} são amigos!`)
    window.location.href = "/" // direto para o botão PAGUEI!
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="rotulo mb-1">O que {convidanteNome} pode ver de você?</h2>
        <p className="mb-3 text-sm font-medium">
          Você escolhe. {pelotao ? "No pelotão, quem decide o que todos veem é o comandante. " : ""}Dá para mudar depois.
        </p>
        <SeletorNivel valor={nivel} aoMudar={setNivel} desabilitado={enviando} />
      </div>
      <button onClick={aceitar} disabled={enviando} className="pilula pilula-cheia w-full !py-4 text-base">
        {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        Aceitar e pagar dez
      </button>
    </div>
  )
}
