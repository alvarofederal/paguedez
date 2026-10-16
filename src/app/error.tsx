"use client"

import { useEffect } from "react"
import Link from "next/link"
import { CartaoAcesso } from "@/components/cartao-acesso"

// Tela de erro do app inteiro: em vez da página branca padrão, o usuário vê o que fazer.
export default function ErroDoApp({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <CartaoAcesso subtitulo="Algo deu errado por aqui. A tropa já está de olho!">
      <div className="space-y-3">
        <button onClick={reset} className="pilula pilula-cheia w-full !py-4 text-base">
          Tentar de novo
        </button>
        <Link href="/" className="pilula pilula-fantasma w-full !py-4 text-base">
          Voltar ao início
        </Link>
        {error.digest && <p className="text-center text-xs text-[var(--texto-3)]">Código: {error.digest}</p>}
      </div>
    </CartaoAcesso>
  )
}
