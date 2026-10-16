"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { cancelarConviteAction, reenviarConviteAction } from "@/app/_actions/social"
import { abrirWhatsapp } from "@/lib/abrir-whatsapp"

type Convite = {
  id: string
  apelido: string
  mascara: string
  status: "PENDENTE" | "ACEITO" | "EXPIRADO" | "CANCELADO"
  criadoEm: string
  expiraEm: string
  pelotao: string | null
  aceitoPor: string | null
}

const ROTULO: Record<Convite["status"], { texto: string; cor: string }> = {
  PENDENTE: { texto: "Aguardando", cor: "var(--sol)" },
  ACEITO: { texto: "Aceitou!", cor: "var(--menta)" },
  EXPIRADO: { texto: "Expirou", cor: "var(--nevoa)" },
  CANCELADO: { texto: "Cancelado", cor: "var(--nevoa)" },
}

const data = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" })

export function ListaConvites({ convites }: { convites: Convite[] }) {
  const [pendente, iniciar] = useTransition()

  if (convites.length === 0) {
    return <p className="adesivo p-5 text-center font-bold">Nenhum convite ainda. Chame a tropa!</p>
  }

  const reenviar = (id: string) =>
    iniciar(async () => {
      const r = await reenviarConviteAction(id)
      if (r.erro !== null || !("whatsappUrl" in r)) return void toast.error(r.erro ?? "Erro ao reenviar")
      abrirWhatsapp(r.whatsappUrl) // abre o WhatsApp para escolher o contato (o número não fica guardado)
    })

  const cancelar = (id: string) =>
    iniciar(async () => {
      const r = await cancelarConviteAction(id)
      if (r.erro) toast.error(r.erro)
      else toast.success("Convite cancelado")
    })

  return (
    <ul className="space-y-3">
      {convites.map((c) => {
        const r = ROTULO[c.status]
        return (
          <li key={c.id} className="adesivo p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-bold">{c.apelido}</p>
                <p className="text-sm text-[var(--texto-3)]">
                  {c.mascara} · enviado em {data.format(new Date(c.criadoEm))}
                </p>
                {c.pelotao && <p className="mt-1 text-xs font-bold">Pelotão: {c.pelotao}</p>}
                {c.status === "ACEITO" && c.aceitoPor && <p className="mt-1 text-xs font-bold">Entrou como {c.aceitoPor}</p>}
              </div>
              <span className="rotulo shrink-0 rounded-full border border-black px-3 py-1" style={{ background: r.cor }}>
                {r.texto}
              </span>
            </div>
            {(c.status === "PENDENTE" || c.status === "EXPIRADO") && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button disabled={pendente} onClick={() => reenviar(c.id)} className="pilula pilula-cheia !px-3 !py-1.5 text-xs">
                  {c.status === "EXPIRADO" ? "Renovar e reenviar" : "Reenviar"}
                </button>
                <button disabled={pendente} onClick={() => cancelar(c.id)} className="pilula pilula-fantasma !px-3 !py-1.5 text-xs">
                  Cancelar
                </button>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
