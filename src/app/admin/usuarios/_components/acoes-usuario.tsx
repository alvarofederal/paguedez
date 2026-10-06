"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { adminAlternarAtivo } from "@/app/_actions/usuarios"

export function AcoesUsuario({ userId, ativo }: { userId: string; ativo: boolean }) {
  const [pendente, iniciar] = useTransition()

  const alternar = () =>
    iniciar(async () => {
      const { erro } = await adminAlternarAtivo(userId)
      if (erro) toast.error(erro)
    })

  return (
    <button disabled={pendente} className="pilula pilula-fantasma shrink-0 !px-3 !py-1.5 text-xs" onClick={alternar}>
      {ativo ? "Desativar" : "Ativar"}
    </button>
  )
}
