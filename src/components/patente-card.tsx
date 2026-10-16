import Link from "next/link"
import { BarrasProgresso } from "@/components/barras-progresso"
import { Insignia } from "@/components/insignia"
import type { DefinicaoPatente, ProgressoPatente } from "@/lib/patentes"

/** Card da patente na tela Pagar: patente atual + quanto falta para a próxima. */
export function PatenteCard({ atual, progresso }: { atual: DefinicaoPatente; progresso: ProgressoPatente | null }) {
  return (
    <section className="adesivo mt-4 p-4">
      <div className="flex items-center gap-4">
        <Insignia patente={atual.patente} tamanho={72} />
        <div className="min-w-0">
          <p className="rotulo">Sua patente</p>
          <p className="display text-3xl leading-none">{atual.titulo}</p>
          <p className="mt-1 text-sm font-medium">{atual.lema}</p>
        </div>
      </div>

      {progresso ? (
        <div className="mt-4">
          <p className="rotulo mb-2">
            Próxima: {progresso.proxima.titulo} · {progresso.percentual}%
          </p>
          <BarrasProgresso itens={progresso.itens} />
        </div>
      ) : (
        <p className="mt-4 rounded-[14px] border border-black bg-[var(--sol)] p-3 text-center font-bold">Você chegou ao topo da tropa!</p>
      )}

      <Link href="/patentes" className="pilula pilula-fantasma mt-4 w-full">
        Ver todas as patentes
      </Link>
    </section>
  )
}
