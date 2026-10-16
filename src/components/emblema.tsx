import { Flag, Flame, Lock, Megaphone, Shield, Target, type LucideIcon } from "lucide-react"
import type { DefinicaoEmblema } from "@/lib/emblemas"

const ICONES: Record<DefinicaoEmblema["icone"], LucideIcon> = {
  shield: Shield,
  megaphone: Megaphone,
  flag: Flag,
  flame: Flame,
  target: Target,
}

type Props = {
  titulo: string
  descricao: string
  como: string
  cor: DefinicaoEmblema["cor"]
  icone: DefinicaoEmblema["icone"]
  conquistadoEm: Date | null
}

const dataBR = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" })

// Adesivo circular: colorido quando conquistado; cinza com cadeado quando falta conquistar.
export function Emblema({ titulo, descricao, como, cor, icone, conquistadoEm }: Props) {
  const Icone = ICONES[icone]
  const ganho = conquistadoEm !== null

  return (
    <li className={`adesivo flex flex-col items-center p-4 text-center ${ganho ? "" : "bg-[var(--nevoa)]"}`}>
      <span
        className="relative flex h-24 w-24 items-center justify-center rounded-full border border-black"
        style={{ background: ganho ? `var(--${cor})` : "var(--concreto)" }}
        aria-hidden="true"
      >
        <Icone className={`h-11 w-11 ${ganho ? "" : "opacity-40"}`} strokeWidth={2.2} />
        {!ganho && (
          <span className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full border border-black bg-white">
            <Lock className="h-4 w-4" />
          </span>
        )}
      </span>
      <h3 className="display mt-3 text-2xl">{titulo}</h3>
      <p className="mt-2 text-sm font-medium">{descricao}</p>
      {ganho ? (
        <p className="rotulo mt-3 rounded-full border border-black bg-white px-3 py-1">Conquistado em {dataBR.format(conquistadoEm)}</p>
      ) : (
        <p className="rotulo mt-3 rounded-full border border-black bg-white px-3 py-1">Como ganhar: {como}</p>
      )}
    </li>
  )
}
