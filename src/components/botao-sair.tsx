"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { Loader2, LogOut } from "lucide-react"

// Logout feito no navegador (igual ao login): o redirecionamento usa o endereço em que o
// usuário realmente está, e não o NEXTAUTH_URL do servidor — que pode apontar para outro lugar.
export function BotaoSair() {
  const [saindo, setSaindo] = useState(false)

  const sair = async () => {
    setSaindo(true)
    try {
      await signOut({ redirect: false })
    } finally {
      // Recarga completa: limpa o estado em memória e volta ao tema padrão (azul)
      window.location.href = "/login"
    }
  }

  return (
    <button
      type="button"
      onClick={sair}
      disabled={saindo}
      className="pilula pilula-fantasma !p-2.5"
      aria-label="Sair"
      title="Sair"
    >
      {saindo ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
    </button>
  )
}
