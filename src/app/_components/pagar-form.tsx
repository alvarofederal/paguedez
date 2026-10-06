"use client"

import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import { Loader2, Minus, Plus } from "lucide-react"
import { apagarSerie, pagarFlecas } from "@/app/_actions/flexoes"
import { Celebracao, type ConquistaCelebrada } from "@/components/celebracao"
import { NOME_TIPO_TACA } from "@/lib/tacas"
import { LIMITES } from "@/lib/limites"

const ATALHOS = [10, 20, 30, 50]

export function PagarForm() {
  const [quantidade, setQuantidade] = useState("10")
  const [pendente, iniciar] = useTransition()
  const [conquistas, setConquistas] = useState<ConquistaCelebrada[]>([])
  const [ultimoRegistro, setUltimoRegistro] = useState<{ id: string; quantidade: number } | null>(null)

  // Contagem regressiva do botão. O servidor é quem manda; isto só evita cliques inúteis.
  const [restante, setRestante] = useState(0)
  useEffect(() => {
    if (restante <= 0) return
    const t = setTimeout(() => setRestante((r) => r - 1), 1000)
    return () => clearTimeout(t)
  }, [restante])

  const ajustar = (delta: number) =>
    setQuantidade((q) => String(Math.min(LIMITES.maxPorSerie, Math.max(1, (Number(q) || 0) + delta))))

  // Digitou errado? Apaga a série recém-registrada (e as taças que ela tenha gerado)
  const desfazer = async (registro: { id: string; quantidade: number }) => {
    const { erro } = await apagarSerie(registro.id)
    if (erro) toast.error(erro)
    else toast.success(`Registro de ${registro.quantidade} flecas desfeito`)
  }

  const pagar = () => {
    const numero = Number(quantidade)
    if (numero > LIMITES.confirmarAcima && !confirm(`Foram mesmo ${numero} flecas de uma vez?`)) return

    iniciar(async () => {
      const resultado = await pagarFlecas(numero)
      if (resultado.erro !== null) {
        toast.error(resultado.erro)
        if (resultado.esperarSegundos > 0) setRestante(resultado.esperarSegundos)
        return
      }
      setRestante(LIMITES.intervaloMinimoSeg)

      const registro = { id: resultado.registroId, quantidade: numero }
      const opcoesToast = {
        duration: 8000,
        action: { label: "Desfazer", onClick: () => desfazer(registro) },
      }
      const hoje = resultado.resumo.find((r) => r.tipo === "DIARIO")?.atual ?? numero
      const novas = resultado.conquistas.filter((c) => c.nova)
      const ampliadas = resultado.conquistas.filter((c) => !c.nova)

      if (novas.length > 0) {
        setUltimoRegistro(registro)
        setConquistas(novas)
      } else if (ampliadas.length > 0) {
        toast.success(`${NOME_TIPO_TACA[ampliadas[ampliadas.length - 1].tipo]} ampliado: ${hoje} flecas hoje!`, opcoesToast)
      } else {
        toast.success(`+${numero} flecas pagas! Hoje: ${hoje}`, opcoesToast)
      }
    })
  }

  const fecharCelebracao = () => {
    setConquistas([])
    setUltimoRegistro(null)
  }

  return (
    <>
      <form
        className="flex flex-col items-center"
        onSubmit={(e) => {
          e.preventDefault()
          pagar()
        }}
      >
        <div className="relative w-full text-center">
          {/* Adesivos decorativos */}
          <span
            aria-hidden="true"
            className="display absolute -top-3 left-0 flex h-12 w-12 rotate-[-14deg] items-center justify-center rounded-full border border-black bg-[var(--sol)] text-xl"
          >
            10
          </span>
          <span
            aria-hidden="true"
            className="rotulo absolute -top-1 right-0 rotate-[9deg] rounded-full border border-black bg-[var(--menta)] px-3 py-1.5"
          >
            Selva!
          </span>
          <h1 className="display pt-6 text-[48px] sm:text-[64px]">
            Quantas
            <br />
            flecas?
          </h1>
        </div>

        <div className="adesivo mt-6 flex w-full items-center justify-between gap-2 p-3">
          <button
            type="button"
            onClick={() => ajustar(-1)}
            className="pilula pilula-fantasma h-14 w-14 shrink-0 !p-0"
            aria-label="Diminuir"
          >
            <Minus className="h-6 w-6" />
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={LIMITES.maxPorSerie}
            required
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            onFocus={(e) => e.target.select()}
            className="display w-full min-w-0 bg-transparent text-center text-[72px] outline-none"
            aria-label="Quantidade de flexões"
          />
          <button
            type="button"
            onClick={() => ajustar(1)}
            className="pilula pilula-fantasma h-14 w-14 shrink-0 !p-0"
            aria-label="Aumentar"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>

        <div className="mt-3 flex justify-center gap-2">
          {ATALHOS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setQuantidade(String(n))}
              className={`pilula ${quantidade === String(n) ? "pilula-cheia" : "pilula-fantasma"} min-w-14`}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Botão principal: círculo preto sobre um disco da cor do tema (azul/rosa) */}
        <div className="mt-10 rounded-full border border-black bg-[var(--marca)] p-4">
          <button
            type="submit"
            disabled={pendente || restante > 0}
            className="botao-pagar flex h-48 w-48 flex-col items-center justify-center rounded-full disabled:opacity-80"
          >
            {pendente ? (
              <Loader2 className="h-12 w-12 animate-spin" />
            ) : restante > 0 ? (
              <>
                <span className="display text-[56px]">{restante >= 60 ? `${Math.floor(restante / 60)}:${String(restante % 60).padStart(2, "0")}` : restante}</span>
                <span className="rotulo mt-1 opacity-70">descansando</span>
              </>
            ) : (
              <>
                <span className="display text-[38px]">Paguei!</span>
                <span className="rotulo mt-2 opacity-70">registrar</span>
              </>
            )}
          </button>
        </div>
      </form>

      <Celebracao
        conquistas={conquistas}
        aoFechar={fecharCelebracao}
        aoDesfazer={
          ultimoRegistro
            ? () => {
                const registro = ultimoRegistro
                fecharCelebracao()
                desfazer(registro)
              }
            : undefined
        }
      />
    </>
  )
}
