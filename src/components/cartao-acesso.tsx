import { Marca } from "./marca"
import { FaixaRolante } from "./faixa-rolante"

export function CartaoAcesso({ subtitulo, children }: { subtitulo: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <FaixaRolante />
      <div className="flex flex-1 flex-col items-center px-4 py-10">
        <div className="relative mb-8 text-center">
          {/* Adesivos em volta do bloco display */}
          <span
            aria-hidden="true"
            className="display absolute -top-3 -left-6 flex h-16 w-16 rotate-[-12deg] items-center justify-center rounded-full border border-black bg-[var(--sol)] text-2xl"
          >
            10
          </span>
          <span
            aria-hidden="true"
            className="rotulo absolute top-1/2 -right-8 rotate-[10deg] rounded-full border border-black bg-[var(--menta)] px-3 py-1.5"
          >
            Selva!
          </span>
          <span
            aria-hidden="true"
            className="absolute -bottom-3 left-2 h-8 w-8 rotate-12 rounded-[10px] border border-black bg-[var(--brasa)]"
          />
          <Marca tamanho="lg" />
        </div>
        <p className="mb-6 max-w-xs text-center text-lg font-bold">{subtitulo}</p>
        <div className="adesivo-grande w-full max-w-sm bg-white p-6">{children}</div>
      </div>
    </div>
  )
}

export const estiloCampo =
  "w-full rounded-full border border-black bg-white px-5 py-3.5 font-bold text-black placeholder:font-medium placeholder:text-[var(--texto-3)] outline-none transition focus:bg-[var(--lavado)]"

export const estiloRotulo = "rotulo mb-1.5 ml-4 block"

export const estiloBotaoPrincipal = "pilula pilula-cheia w-full !py-4 text-base"
