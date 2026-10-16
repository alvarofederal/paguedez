import { PlacarPeriodos } from "@/components/placar-periodos"
import { Taca } from "@/components/taca"
import { GraficoDiario } from "@/app/historico/_components/grafico-diario"
import { categoriaTaca, NOME_TIPO_TACA } from "@/lib/tacas"
import { rotuloPeriodo } from "@/lib/periodos"
import { NIVEIS_VISIBILIDADE, podeVerDetalhes, podeVerRecordes } from "@/lib/visibilidade"
import { historico } from "@/server/flexoes"

const hora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })

/**
 * O que um usuário enxerga do outro, de acordo com o nível de visibilidade:
 * 0 = nada além do ranking · 1 = recordes e taças · 2 = + séries de hoje e gráfico.
 * Os dados só são buscados (e enviados ao navegador) se o nível permitir.
 */
export async function PerfilVisivel({ userId, nome, nivel, quemDecide }: { userId: string; nome: string; nivel: number; quemDecide: string }) {
  const titulo = NIVEIS_VISIBILIDADE.find((n) => n.nivel === nivel)?.titulo ?? "Só o ranking"

  if (!podeVerRecordes(nivel)) {
    return (
      <p className="adesivo p-5 text-center font-bold">
        {quemDecide} mostra <span className="underline">{titulo.toLowerCase()}</span>. Os detalhes de {nome} ficam só com ele(a).
      </p>
    )
  }

  const dados = await historico(userId)
  const seriesHoje = dados.series.filter((s) => s.dia === dados.hoje)
  const recordeDiario = dados.resumo.find((r) => r.tipo === "DIARIO")?.recorde ?? 0

  return (
    <div className="space-y-6">
      <p className="rotulo inline-block rounded-full border border-black bg-white px-3 py-1.5">Nível: {titulo}</p>

      <section>
        <h2 className="rotulo mb-3">Recordes atuais</h2>
        <PlacarPeriodos resumo={dados.resumo} mostrarPeriodo />
      </section>

      <section>
        <h2 className="rotulo mb-3">Taças ({dados.tacas.length})</h2>
        {dados.tacas.length === 0 ? (
          <p className="adesivo p-5 text-center font-bold">Ainda sem taças.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {dados.tacas.map((t) => (
              <li key={t.id} className="adesivo flex flex-col items-center p-3 text-center">
                <div className="flex h-32 items-end">
                  <Taca nivel={t.nivel} tipo={t.tipo} tamanho={56} />
                </div>
                <p className="mt-2 text-sm font-bold">{NOME_TIPO_TACA[t.tipo]}</p>
                <p className="display text-2xl">{t.valor}</p>
                <p className="text-xs text-[var(--texto-3)]">
                  {categoriaTaca(t.nivel, t.tipo).nome} · {rotuloPeriodo(t.tipo, t.periodo)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {podeVerDetalhes(nivel) && (
        <>
          <section className="adesivo p-5">
            <h2 className="rotulo">Flecas por dia</h2>
            <p className="mb-2 text-sm text-[var(--texto-3)]">Últimos 30 dias</p>
            <GraficoDiario dados={dados.ultimos30} recorde={recordeDiario} />
          </section>

          <section className="adesivo p-5">
            <h2 className="rotulo mb-2">Séries de hoje</h2>
            {seriesHoje.length === 0 ? (
              <p className="text-sm">Nenhuma fleca paga hoje.</p>
            ) : (
              <ul className="divide-y divide-black/15">
                {seriesHoje.map((s) => (
                  <li key={s.id} className="flex justify-between py-2 text-sm">
                    <span className="text-[var(--texto-3)]">{hora.format(s.feitoEm)}</span>
                    <span className="font-bold">{s.quantidade} flecas</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
