import Link from "next/link"
import { Send } from "lucide-react"
import { usuarioAtual } from "@/lib/auth"
import { socialAtivo } from "@/lib/social-flag"
import { painelDoDia } from "@/server/flexoes"
import { AppShell } from "@/components/app-shell"
import { Taca } from "@/components/taca"
import { PlacarPeriodos } from "@/components/placar-periodos"
import { SeriesHoje } from "@/components/series-hoje"
import { categoriaTaca, NOME_TIPO_TACA } from "@/lib/tacas"
import { Landing } from "./_components/landing"
import { PagarForm } from "./_components/pagar-form"

export const dynamic = "force-dynamic"

export default async function InicioPage() {
  const usuario = await usuarioAtual()
  if (!usuario) return <Landing /> // visitante: landing page pública

  const { resumo, seriesHoje, ultimaTaca } = await painelDoDia(usuario.id)

  return (
    <AppShell usuario={usuario}>
      <section className="pt-4 pb-10">
        <PagarForm />
      </section>

      <PlacarPeriodos resumo={resumo} />

      {socialAtivo() && (
        <section className="mt-4 flex flex-col gap-3 rounded-[20px] border border-black bg-[var(--violeta)] p-4 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="display text-2xl">Chame a tropa!</p>
            <p className="text-sm font-medium">Mande um amigo pagar dez pelo WhatsApp e veja quem lidera o ranking.</p>
          </div>
          <Link href="/convidar" className="pilula pilula-fantasma shrink-0">
            <Send className="h-4 w-4" /> Mandar pagar dez
          </Link>
        </section>
      )}

      {ultimaTaca && (
        <section className="mt-4 flex items-center gap-4 rounded-[20px] border border-black bg-[var(--lavanda)] p-4">
          <Taca nivel={ultimaTaca.nivel} tipo={ultimaTaca.tipo} tamanho={64} crescer={false} />
          <div>
            <p className="rotulo">Última taça</p>
            <p className="mt-1 text-lg font-bold leading-tight">
              {NOME_TIPO_TACA[ultimaTaca.tipo]} · {categoriaTaca(ultimaTaca.nivel, ultimaTaca.tipo).nome}
            </p>
            <p className="text-sm">{ultimaTaca.valor} flecas</p>
          </div>
        </section>
      )}

      <SeriesHoje series={seriesHoje} />
    </AppShell>
  )
}
