"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Check, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { convocarAmigoAction } from "@/app/_actions/social"

type Amigo = { userId: string; name: string; pendente: boolean }

// Chama para o pelotão um amigo que JÁ está no app. Ele recebe a convocação em "Pelotões" e decide se aceita.
export function ConvocarAmigos({ comunidadeId, amigos }: { comunidadeId: string; amigos: Amigo[] }) {
  const [enviados, setEnviados] = useState<Set<string>>(new Set())
  const [pendente, iniciar] = useTransition()

  const chamar = (amigo: Amigo) =>
    iniciar(async () => {
      try {
        const r = await convocarAmigoAction(comunidadeId, amigo.userId)
        if (r.erro) return void toast.error(r.erro)
        setEnviados((atual) => new Set(atual).add(amigo.userId))
        toast.success(`Convocação enviada para ${amigo.name.split(" ")[0]}! Ele(a) precisa aceitar no app.`)
      } catch {
        toast.error("Não foi possível convocar agora. Tente de novo.")
      }
    })

  return (
    <section className="mt-8">
      <h2 className="rotulo mb-1">Chamar amigos que já estão na tropa</h2>
      <p className="mb-3 text-sm font-medium">O amigo recebe a convocação no app e escolhe se entra — ninguém é colocado no pelotão sem aceitar.</p>

      {amigos.length === 0 ? (
        <p className="adesivo p-5 text-center text-sm font-bold">
          Nenhum amigo disponível para chamar.{" "}
          <Link href="/convidar" className="underline underline-offset-4">
            Convide alguém pelo WhatsApp
          </Link>
          .
        </p>
      ) : (
        <ul className="adesivo divide-y divide-black/15 px-4">
          {amigos.map((a) => {
            const aguardando = a.pendente || enviados.has(a.userId)
            return (
              <li key={a.userId} className="flex items-center justify-between gap-3 py-3">
                <span className="min-w-0 truncate font-bold">{a.name}</span>
                {aguardando ? (
                  <span className="rotulo flex shrink-0 items-center gap-1 rounded-full border border-black bg-[var(--sol)] px-3 py-1.5">
                    <Check className="h-3.5 w-3.5" /> Aguardando
                  </span>
                ) : (
                  <button onClick={() => chamar(a)} disabled={pendente} className="pilula pilula-cheia shrink-0 !px-4 !py-2 text-xs">
                    <UserPlus className="h-4 w-4" /> Chamar
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
