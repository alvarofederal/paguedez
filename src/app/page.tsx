import { usuarioAtual } from "@/lib/auth"
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
