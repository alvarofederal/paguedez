import { redirect } from "next/navigation"
import { usuarioAtual } from "@/lib/auth"
import { historico } from "@/server/flexoes"
import { AppShell } from "@/components/app-shell"
import { PlacarPeriodos } from "@/components/placar-periodos"
import { Taca } from "@/components/taca"
import { categoriaTaca, NOME_TIPO_TACA } from "@/lib/tacas"
import { rotuloPeriodo } from "@/lib/periodos"
import { GraficoDiario } from "./_components/grafico-diario"

export const dynamic = "force-dynamic"
export const metadata = { title: "Histórico" }

const dataHora = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
})

export default async function HistoricoPage() {
  const usuario = await usuarioAtual()
  if (!usuario) redirect("/login")

  const { resumo, tacas, series, ultimos30 } = await historico(usuario.id)
  const recordeDiario = resumo.find((r) => r.tipo === "DIARIO")?.recorde ?? 0

  return (
    <AppShell usuario={usuario}>
      <h1 className="display mt-2 mb-6 text-[52px]">Histórico</h1>

      <h2 className="rotulo mb-3">Recordes atuais</h2>
      <PlacarPeriodos resumo={resumo} mostrarPeriodo />

      <section className="adesivo mt-6 p-5">
        <h2 className="rotulo">Flecas por dia</h2>
        <p className="mb-2 text-sm text-[var(--texto-3)]">Últimos 30 dias</p>
        <GraficoDiario dados={ultimos30} recorde={recordeDiario} />
      </section>

      <section className="mt-6">
        <h2 className="rotulo mb-3">Galeria de taças ({tacas.length})</h2>
        {tacas.length === 0 ? (
          <p className="adesivo p-6 text-center font-bold">Pague sua primeira fleca para ganhar a taça de Recruta!</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {tacas.map((t) => (
              <li key={t.id} className="adesivo flex flex-col items-center p-3 text-center">
                <div className="flex h-36 items-end">
                  <Taca nivel={t.nivel} tipo={t.tipo} tamanho={62} />
                </div>
                <p className="mt-2 text-sm font-bold">{NOME_TIPO_TACA[t.tipo]}</p>
                <p className="display mt-1 text-2xl">{t.valor}</p>
                <p className="rotulo !text-[10px]">flecas</p>
                <p className="mt-1 text-xs text-[var(--texto-3)]">
                  {categoriaTaca(t.nivel, t.tipo).nome} · {rotuloPeriodo(t.tipo, t.periodo)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {series.length > 0 && (
        <section className="adesivo mt-6 p-5">
          <h2 className="rotulo mb-2">Últimas séries</h2>
          <ul className="divide-y divide-black/15">
            {series.map((s) => (
              <li key={s.id} className="flex justify-between py-2.5 text-sm">
                <span className="text-[var(--texto-3)]">{dataHora.format(s.feitoEm)}</span>
                <span className="font-bold">{s.quantidade} flecas</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  )
}
