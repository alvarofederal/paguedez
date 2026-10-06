import { categoriaTaca, escalaTaca, type TipoTaca } from "@/lib/tacas"

type Props = {
  nivel: number
  tipo: TipoTaca
  tamanho?: number // largura base em px, antes da escala por nível
  crescer?: boolean // aplica a escala por nível (taças mais novas maiores)
  className?: string
}

// Estrela de 12 pontas usada como selo-adesivo atrás das taças a partir da Prata
function pontosSelo(cx: number, cy: number, externo: number, interno: number, pontas: number) {
  return Array.from({ length: pontas * 2 }, (_, i) => {
    const raio = i % 2 === 0 ? externo : interno
    const angulo = (Math.PI * i) / pontas - Math.PI / 2
    return `${(cx + raio * Math.cos(angulo)).toFixed(1)},${(cy + raio * Math.sin(angulo)).toFixed(1)}`
  }).join(" ")
}

const CONTORNO = { stroke: "#000", strokeWidth: 2, strokeLinejoin: "round" as const }

export function Taca({ nivel, tipo, tamanho = 64, crescer = true, className }: Props) {
  const { nome, indice, cor, sombra, selo } = categoriaTaca(nivel, tipo)
  const largura = Math.round(tamanho * (crescer ? escalaTaca(nivel) : 1))

  return (
    <svg
      viewBox="0 0 120 130"
      width={largura}
      height={Math.round(largura * (130 / 120))}
      className={className}
      role="img"
      aria-label={`Taça ${nome} nº ${nivel}`}
    >
      {selo && (
        <polygon
          points={pontosSelo(60, 58, 58, 46, 12)}
          fill={selo}
          {...CONTORNO}
          strokeWidth={1.5}
          transform={`rotate(${nivel * 7} 60 58)`}
        />
      )}

      {/* Alças */}
      <path d="M32 30 C12 30 12 62 38 66" fill="none" stroke="#000" strokeWidth="9" strokeLinecap="round" />
      <path d="M32 30 C12 30 12 62 38 66" fill="none" stroke={cor} strokeWidth="5" strokeLinecap="round" />
      <path d="M88 30 C108 30 108 62 82 66" fill="none" stroke="#000" strokeWidth="9" strokeLinecap="round" />
      <path d="M88 30 C108 30 108 62 82 66" fill="none" stroke={cor} strokeWidth="5" strokeLinecap="round" />

      {/* Copa: corpo + meia-face de sombra chapada */}
      <path d="M30 20 H90 V38 C90 62 77 77 60 79 C43 77 30 62 30 38 Z" fill={cor} {...CONTORNO} />
      <path d="M60 20 H90 V38 C90 62 77 77 60 79 Z" fill={sombra} />
      <path d="M30 20 H90 V38 C90 62 77 77 60 79 C43 77 30 62 30 38 Z" fill="none" {...CONTORNO} />
      <path d="M38 27 V40 C38 52 42 61 48 66" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />

      {/* Haste e base */}
      <rect x="54" y="78" width="12" height="16" fill={sombra} {...CONTORNO} />
      <path d="M42 94 H78 L82 106 H38 Z" fill={cor} {...CONTORNO} />
      <rect x="32" y="106" width="56" height="16" rx="5" fill="#000" />

      {/* Estrela na copa a partir do Ouro */}
      {indice >= 2 && (
        <path
          d="M60 32 L64 42 L75 42 L66 49 L69 60 L60 53 L51 60 L54 49 L45 42 L56 42 Z"
          fill="#fff"
          {...CONTORNO}
          strokeWidth={1.5}
        />
      )}

      {/* Coroa na Lendária */}
      {indice >= 5 && (
        <path d="M42 18 L46 4 L53 12 L60 1 L67 12 L74 4 L78 18 Z" fill="#ffd731" {...CONTORNO} />
      )}

      {/* Número da conquista na base preta */}
      <text x="60" y="118.5" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" fontFamily="var(--fonte-ui)">
        Nº {nivel}
      </text>
    </svg>
  )
}
