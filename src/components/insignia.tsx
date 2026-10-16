import { ESCADA, indiceDaPatente, type Patente } from "@/lib/patentes"

const TINTAS = { carbono: "#000000", papel: "#ffffff", sol: "#ffd731" } as const

function estrela(cx: number, cy: number, r: number): string {
  return Array.from({ length: 10 }, (_, i) => {
    const raio = i % 2 === 0 ? r : r * 0.42
    const ang = (Math.PI * i) / 5 - Math.PI / 2
    return `${(cx + raio * Math.cos(ang)).toFixed(1)},${(cy + raio * Math.sin(ang)).toFixed(1)}`
  }).join(" ")
}

// Posições das estrelas: 1 a 3 em fileira; 4 em 2×2; 5 em 3 + 2
function posicoesEstrelas(n: number): { x: number; y: number; r: number }[] {
  if (n === 1) return [{ x: 50, y: 50, r: 22 }]
  if (n === 2) return [{ x: 34, y: 50, r: 15 }, { x: 66, y: 50, r: 15 }]
  if (n === 3) return [{ x: 27, y: 52, r: 13 }, { x: 50, y: 52, r: 13 }, { x: 73, y: 52, r: 13 }]
  if (n === 4) return [{ x: 36, y: 38, r: 13 }, { x: 64, y: 38, r: 13 }, { x: 36, y: 64, r: 13 }, { x: 64, y: 64, r: 13 }]
  return [{ x: 27, y: 38, r: 12 }, { x: 50, y: 38, r: 12 }, { x: 73, y: 38, r: 12 }, { x: 38, y: 64, r: 12 }, { x: 62, y: 64, r: 12 }]
}

/** Insígnia da patente: adesivo redondo com divisas (praças), estrelas (oficiais) ou coroa (Comandante). */
export function Insignia({ patente, tamanho = 64, bloqueada = false }: { patente: Patente; tamanho?: number; bloqueada?: boolean }) {
  const def = ESCADA[indiceDaPatente(patente)]
  const tinta = bloqueada ? "#8a8a8a" : TINTAS[def.tinta]
  const fundo = bloqueada ? "var(--concreto)" : `var(--${def.fundo})`
  const { tipo, n } = def.simbolo

  return (
    <svg viewBox="0 0 100 100" width={tamanho} height={tamanho} role="img" aria-label={`Insígnia de ${def.titulo}`} className="shrink-0">
      <circle cx="50" cy="50" r="47" fill={fundo} stroke="#000" strokeWidth="2.5" />

      {tipo === "nenhum" && <circle cx="50" cy="50" r="7" fill="none" stroke={tinta} strokeWidth="4" />}

      {tipo === "divisas" &&
        Array.from({ length: n }, (_, i) => {
          const topo = 50 - (16 + (n - 1) * 15) / 2 + i * 15
          return <path key={i} d={`M 24 ${topo + 16} L 50 ${topo} L 76 ${topo + 16}`} fill="none" stroke={tinta} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        })}

      {tipo === "estrelas" &&
        posicoesEstrelas(n).map((p, i) => <polygon key={i} points={estrela(p.x, p.y, p.r)} fill={tinta} stroke="#000" strokeWidth="1.2" strokeLinejoin="round" />)}

      {tipo === "coroa" && (
        <>
          <path d="M 24 46 L 29 26 L 41 38 L 50 22 L 59 38 L 71 26 L 76 46 Z" fill={tinta} stroke="#000" strokeWidth="2" strokeLinejoin="round" />
          <polygon points={estrela(50, 66, 12)} fill={tinta} stroke="#000" strokeWidth="1.4" strokeLinejoin="round" />
        </>
      )}
    </svg>
  )
}
