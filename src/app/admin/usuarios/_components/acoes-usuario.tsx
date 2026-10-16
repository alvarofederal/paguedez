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
    if (!confirm(`Excluir DEFINITIVAMENTE o perfil de ${nome} (${email})?\n\n${detalhe}\nSéries, taças, patentes, amizades e pelotões dele serão apagados. Isso não tem volta.`)) return
    iniciar(async () => {
      try {
        const { erro } = await adminExcluirUsuario(userId)
        if (erro) toast.error(erro)
        else toast.success(`Perfil de ${nome} excluído`)
      } catch {
        toast.error("Não foi possível excluir agora. Tente de novo.")
      }
    })
  }

  return (
    <div className="flex shrink-0 flex-col gap-2">
      <button disabled={pendente} className="pilula pilula-fantasma !px-3 !py-1.5 text-xs" onClick={alternar}>
        {ativo ? "Desativar" : "Ativar"}
      </button>
      <button
        disabled={pendente || !exclusaoLiberada}
        onClick={excluir}
        title={exclusaoLiberada ? "Excluir o perfil para sempre" : "Já pagou flecas: desative antes de excluir"}
        className="pilula !px-3 !py-1.5 text-xs"
        style={{ background: exclusaoLiberada ? "var(--brasa)" : "var(--nevoa)", color: exclusaoLiberada ? "#fff" : "var(--texto-3)" }}
      >
        <Trash2 className="h-3.5 w-3.5" /> Excluir
      </button>
    </div>
  )
}
