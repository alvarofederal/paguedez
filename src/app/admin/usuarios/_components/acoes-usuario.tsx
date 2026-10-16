"use client"

import { useTransition } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { adminAlternarAtivo, adminExcluirUsuario } from "@/app/_actions/usuarios"

type Props = {
  userId: string
  nome: string
  email: string
  ativo: boolean
  /** quantas séries de flecas o perfil já registrou */
  series: number
}

export function AcoesUsuario({ userId, nome, email, ativo, series }: Props) {
  const [pendente, iniciar] = useTransition()
  // Perfil que já pagou flecas só pode ser excluído depois de desativado (dois passos, porque não tem volta)
  const exclusaoLiberada = series === 0 || !ativo

  const alternar = () =>
    iniciar(async () => {
      const { erro } = await adminAlternarAtivo(userId)
      if (erro) toast.error(erro)
    })

  const excluir = () => {
    const detalhe = series === 0 ? "Esse perfil nunca registrou flecas." : `Esse perfil tem ${series} ${series === 1 ? "série registrada" : "séries registradas"}.`
    if (!confirm(`Expulsar a bem da disciplina ${nome} (${email})?\n\n${detalhe}\nO perfil será EXCLUÍDO DEFINITIVAMENTE: séries, taças, patentes, amizades e pelotões dele serão apagados. Isso não tem volta.`)) return
    iniciar(async () => {
      try {
        const { erro } = await adminExcluirUsuario(userId)
        if (erro) toast.error(erro)
        else toast.success(`${nome} foi expulso a bem da disciplina`)
      } catch {
        toast.error("Não foi possível expulsar agora. Tente de novo.")
      }
    })
  }

  return (
    <div className="flex shrink-0 gap-2 sm:flex-col">
      <button disabled={pendente} className="pilula pilula-fantasma !px-3 !py-1.5 text-xs sm:w-full" onClick={alternar}>
        {ativo ? "Desativar" : "Ativar"}
      </button>
      <button
        disabled={pendente || !exclusaoLiberada}
        onClick={excluir}
        title={exclusaoLiberada ? "Expulsar a bem da disciplina (exclui o perfil para sempre)" : "Já pagou flecas: desative antes de expulsar"}
        className="pilula flex-1 !whitespace-normal !px-3 !py-1.5 text-center text-xs leading-tight sm:max-w-[9.5rem] sm:flex-none"
        style={{ background: exclusaoLiberada ? "var(--brasa)" : "var(--nevoa)", color: exclusaoLiberada ? "#fff" : "var(--texto-3)" }}
      >
        <Trash2 className="h-3.5 w-3.5 shrink-0" /> Expulso a bem da disciplina
      </button>
    </div>
  )
}
