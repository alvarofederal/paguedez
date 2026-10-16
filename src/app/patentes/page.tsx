import Link from "next/link"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { BarrasProgresso } from "@/components/barras-progresso"
import { Insignia } from "@/components/insignia"
import { usuarioAtual } from "@/lib/auth"
import { ESCADA, REGRAS_PATENTE } from "@/lib/patentes"
import { socialAtivo } from "@/lib/social-flag"
import { sincronizarPatente } from "@/server/patentes"

export const dynamic = "force-dynamic"
export const metadata = { title: "Patentes" }

const NUMERO = new Intl.NumberFormat("pt-BR")
const dataBR = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" })

export default async function PatentesPage() {
  const usuario = await usuarioAtual()
  if (!usuario) redirect("/login")

  const situacao = await sincronizarPatente(usuario.id)
  const social = socialAtivo()
  const quando = new Map(situacao.conquistadas.map((c) => [c.patente, c.conquistadoEm]))

  return (
    <AppShell usuario={usuario}>
      <h1 className="display mt-2 mb-5 text-[52px]">Patentes</h1>

      <section className="adesivo p-4">
        <div className="flex items-center gap-4">
          <Insignia patente={situacao.atual.patente} tamanho={84} />
          <div>
            <p className="rotulo">Você é</p>
            <p className="display text-4xl leading-none">{situacao.atual.titulo}</p>
            <p className="mt-1 text-sm font-medium">{situacao.atual.lema}</p>
          </div>
        </div>
        {situacao.progresso && (
          <div className="mt-4">
            <p className="rotulo mb-2">Para ser {situacao.progresso.proxima.titulo} · {situacao.progresso.percentual}%</p>
            <BarrasProgresso itens={situacao.progresso.itens} />
          </div>
        )}
      </section>

      <section className="mt-6 rounded-[20px] border border-black bg-[var(--sol)] p-4">
        <h2 className="rotulo mb-2">Como se sobe de patente (sem clicar à toa)</h2>
        <ul className="space-y-1.5 text-sm font-medium">
          <li>
            <strong>Dia pago</strong> = pelo menos {REGRAS_PATENTE.minimoDiaPago} flecas no dia. Só dias pagos contam como constância.
          </li>
          <li>
            Contam no máximo <strong>{REGRAS_PATENTE.tetoFlecasPorDia} flecas por dia</strong> para a patente. Não adianta mandar mil de uma vez.
          </li>
          <li>Cada patente exige <strong>flecas</strong> e também <strong>dias pagos</strong>: é preciso aparecer, não só acumular.</li>
          {social && (
            <li>
              Do Sargento em diante é preciso <strong>recrutar amigos ativos</strong> (que pagaram em {REGRAS_PATENTE.diasPagosDoRecruta} dias diferentes).
            </li>
          )}
          <li>Patente conquistada <strong>nunca se perde</strong>.</li>
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="rotulo mb-3">A escada completa</h2>
        <ol className="space-y-3">
          {ESCADA.map((d, i) => {
            const tem = quando.get(d.patente)
            const atual = i === situacao.indice
            const r = d.requisitos
            return (
              <li key={d.patente} className={`adesivo flex items-center gap-4 p-3 ${atual ? "bg-[var(--sol)]" : tem ? "" : "bg-[var(--nevoa)]"}`}>
                <Insignia patente={d.patente} tamanho={60} bloqueada={!tem} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-bold leading-tight">
                    <span className="display text-xl">{d.titulo}</span>
                    {atual && <span className="rotulo rounded-full border border-black bg-white px-2 py-0.5 !text-[10px]">Você está aqui</span>}
                  </p>
                  <p className="text-xs font-medium">
                    {i === 0
                      ? "Ponto de partida de todo mundo."
                      : `${NUMERO.format(r.flecas)} flecas · ${r.dias} dias pagos${social && r.recrutas > 0 ? ` · ${r.recrutas} ${r.recrutas === 1 ? "recruta ativo" : "recrutas ativos"}` : ""}`}
                  </p>
                  {tem && i > 0 && <p className="mt-0.5 text-[11px] text-[var(--texto-3)]">Conquistada em {dataBR.format(tem)}</p>}
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      {social && (
        <p className="mt-6 text-center text-sm">
          Falta recrutar?{" "}
          <Link href="/convidar" className="font-bold underline underline-offset-4">
            Mande um amigo pagar dez
          </Link>
          .
        </p>
      )}
    </AppShell>
  )
}
