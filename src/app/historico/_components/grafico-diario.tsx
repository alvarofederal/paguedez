"use client"

import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type Ponto = { dia: string; quantidade: number }

const rotuloDia = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`
const TINTA_EIXO = { fill: "#6b6b6b", fontSize: 11, fontWeight: 500 }

function Dica({ active, payload }: { active?: boolean; payload?: { payload: Ponto }[] }) {
  if (!active || !payload?.length) return null
  const { dia, quantidade } = payload[0].payload
  return (
    <div className="rounded-2xl border border-black bg-white px-3 py-2 text-sm">
      <p className="text-[var(--texto-3)]">{rotuloDia(dia)}</p>
      <p className="font-bold">{quantidade} flecas</p>
    </div>
  )
}

// Série única (flecas por dia) na cor do tema, com contorno preto de adesivo
export function GraficoDiario({ dados, recorde }: { dados: Ponto[]; recorde: number }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart data={dados} margin={{ top: 18, right: 4, bottom: 0, left: -22 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke="rgb(0 0 0 / 0.1)" />
          <XAxis dataKey="dia" tickFormatter={rotuloDia} tick={TINTA_EIXO} axisLine={false} tickLine={false} interval={6} />
          <YAxis allowDecimals={false} tick={TINTA_EIXO} axisLine={false} tickLine={false} />
          <Tooltip content={<Dica />} cursor={{ fill: "rgb(0 0 0 / 0.05)" }} />
          {recorde > 0 && (
            <ReferenceLine
              y={recorde}
              stroke="#000"
              strokeDasharray="4 4"
              label={{ value: `Recorde ${recorde}`, position: "insideTopLeft", fill: "#000", fontSize: 11, fontWeight: 700 }}
            />
          )}
          <Bar dataKey="quantidade" fill="var(--marca)" stroke="#000" strokeWidth={1} radius={[4, 4, 0, 0]} maxBarSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
