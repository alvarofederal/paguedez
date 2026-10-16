"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { responderConvocacaoAction } from "@/app/_actions/social"
import { corCss } from "@/lib/comunidade"
import { NIVEIS_VISIBILIDADE } from "@/lib/visibilidade"

type Convocacao = {
  id: string
  comunidadeId: string
  nome: string
  descricao: string | null
  cor: string
  nivelVisibilidade: number
  convidanteNome: string
}

export function CartaoConvocacao({ convocacao: c }: { convocacao: Convocacao }) {
  const [pendente, iniciar] = useTransition()
  const nivel = NIVEIS_VISIBILIDADE.find((n) => n.nivel === c.nivelVisibilidade) ?? NIVEIS_VISIBILIDADE[0]

  const responder = (aceitar: boolean) =>
    iniciar(async () => {
      try {
        const r = await responderConvocacaoAction(c.id, aceitar)
        if (r.erro !== null) return void toast.error(r.erro)
        if (aceitar && "comunidadeId" in r && r.comunidadeId) {
          toast.success(`Você entrou no pelotão ${c.nome}!`)
          window.location.href = `/comunidades/${r.comunidadeId}`
        } else {
          toast.success("Convocação recusada")
        }
      } catch {
        toast.error("Não foi possível responder agora. Tente de novo.")
      }
    })

  return (
    <li className="rounded-[20px] border border-black p-4" style={{ background: corCss(c.cor) }}>
      <p className="rotulo">{c.convidanteNome} convocou você para o pelotão</p>
      <p className="display mt-1 break-words text-3xl">{c.nome}</p>
      {c.descricao && <p className="mt-1 text-sm font-medium">{c.descricao}</p>}
      <p className="mt-3 rounded-[14px] border border-black bg-white p-3 text-sm">
        <strong>Ao entrar, os membros veem de você:</strong> {nivel.titulo.toLowerCase()}. <span className="text-[var(--texto-3)]">{nivel.descricao}</span>
      </p>
      <div className="mt-3 flex gap-2">
        <button onClick={() => responder(true)} disabled={pendente} className="pilula pilula-cheia flex-1 !py-3">
          Aceitar
        </button>
        <button onClick={() => responder(false)} disabled={pendente} className="pilula pilula-fantasma flex-1 !py-3">
          Recusar
        </button>
      </div>
    </li>
  )
}
