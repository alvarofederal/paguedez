"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { adminAlternarAtivo, adminAlternarPapel } from "@/app/_actions/usuarios"

const estiloAcao =
  "pilula pilula-fantasma !px-3 !py-1.5 text-xs"

export function AcoesUsuario({ userId, ativo, admin }: { userId: string; ativo: boolean; admin: boolean }) {
  const [pendente, iniciar] = useTransition()

  const executar = (acao: () => Promise<{ erro: string | null }>) =>
    iniciar(async () => {
      const { erro } = await acao()
      if (erro) toast.error(erro)
    })

  return (
    <div className="flex shrink-0 flex-col gap-2">
      <button disabled={pendente} className={estiloAcao} onClick={() => executar(() => adminAlternarAtivo(userId))}>
        {ativo ? "Desativar" : "Ativar"}
      </button>
      <button disabled={pendente} className={estiloAcao} onClick={() => executar(() => adminAlternarPapel(userId))}>
        {admin ? "Tirar admin" : "Tornar admin"}
      </button>
    </div>
  )
}
