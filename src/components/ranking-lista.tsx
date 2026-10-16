import Link from "next/link"
import { ROTULO_PERIODO, TIPOS_PERIODO, type TipoPeriodo } from "@/lib/periodos"
import { ESCADA, indiceDaPatente, type Patente } from "@/lib/patentes"
import { faltamParaPassar, type LinhaRanking } from "@/lib/ranking"

/** Abas Hoje / Semana / Mês / Ano (links, sem JavaScript). */
export function AbasPeriodo({ base, atual }: { base: string; atual: TipoPeriodo }) {
  return (
    <nav className="mb-3 flex flex-wrap gap-2" aria-label="Período do ranking">
      {TIPOS_PERIODO.map((t) => (
        <Link
          key={t}
          href={`${base}?p=${t}`}
          scroll={false}
          className={`pilula ${t === atual ? "pilula-cheia" : "pilula-fantasma"} !px-4 !py-2 text-xs`}
          aria-current={t === atual ? "true" : undefined}
        >
          {ROTULO_PERIODO[t]}
        </Link>
      ))}
    </nav>
  )
}

export function periodoDaUrl(valor: string | undefined, padrao: TipoPeriodo = "SEMANAL"): TipoPeriodo {
  return (TIPOS_PERIODO as readonly string[]).includes(valor ?? "") ? (valor as TipoPeriodo) : padrao
}

/**
 * Ranking do grupo. `hrefDe` devolve o link do perfil (ou null quando não há para onde ir).
 * Só mostra nome e total — nenhum detalhe das séries aparece aqui.
 */
export function RankingLista({
  linhas,
  euId,
  hrefDe,
  patentes,
}: {
  linhas: LinhaRanking[]
  euId: string
  hrefDe?: (userId: string) => string | null
  /** patente de cada usuário (mostrada em letras pequenas ao lado do nome) */
  patentes?: Record<string, Patente>
}) {
  const falta = faltamParaPassar(linhas, euId)

  return (
    <div>
      <ol className="space-y-2">
        {linhas.map((l) => {
          const euSou = l.userId === euId
          const lider = l.posicao === 1 && l.total > 0
          const href = !euSou ? hrefDe?.(l.userId) : null
          const miolo = (
            <>
              <span className="display flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black bg-[var(--lavado)] text-base">
                {l.posicao}
              </span>
              <span className="min-w-0 flex-1 truncate font-bold">
                {lider && <span aria-label="líder">👑 </span>}
                {l.name}
                {euSou && <span className="font-medium"> (você)</span>}
                {patentes?.[l.userId] && (
                  <span className="rotulo ml-2 rounded-full border border-black bg-white px-1.5 py-0.5 !text-[10px]" title={ESCADA[indiceDaPatente(patentes[l.userId])].titulo}>
                    {ESCADA[indiceDaPatente(patentes[l.userId])].abreviacao}
                  </span>
                )}
              </span>
              <span className="display text-xl">{l.total}</span>
            </>
          )
          const classe = `flex items-center gap-3 rounded-full border border-black px-3 py-2 ${euSou ? "bg-[var(--sol)]" : "bg-white"}`
          return (
            <li key={l.userId}>
              {href ? (
                <Link href={href} className={`${classe} transition hover:bg-[var(--nevoa)]`}>
                  {miolo}
                </Link>
              ) : (
                <div className={classe}>{miolo}</div>
              )}
            </li>
          )
        })}
      </ol>
      {falta && (
        <p className="mt-3 text-center text-sm font-bold">
          Faltam <span className="rounded-full border border-black bg-[var(--menta)] px-2 py-0.5">{falta.faltam}</span> flecas para passar {falta.nome}!
        </p>
      )}
    </div>
  )
}
