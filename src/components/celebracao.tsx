"use client"

import { useEffect } from "react"
import confetti from "canvas-confetti"
import { motion, AnimatePresence } from "framer-motion"
import { Taca } from "./taca"
import { categoriaTaca, NOME_TIPO_TACA, type TipoTaca } from "@/lib/tacas"

export type ConquistaCelebrada = {
  tipo: TipoTaca
  valor: number
  nivel: number
}

// Confete com a paleta de adesivos
const CORES = ["#4da2ff", "#55db9c", "#e9ccff", "#fb4903", "#ffd731", "#5c4ade", "#ff6fb5"]

function soltarConfetes() {
  const fim = Date.now() + 1800
  confetti({ particleCount: 180, spread: 110, startVelocity: 55, origin: { y: 0.6 }, colors: CORES, zIndex: 60 })

  const lateral = () => {
    confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: CORES, zIndex: 60 })
    confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: CORES, zIndex: 60 })
    if (Date.now() < fim) requestAnimationFrame(lateral)
  }
  lateral()
}

export function Celebracao({
  conquistas,
  aoFechar,
  aoDesfazer,
}: {
  conquistas: ConquistaCelebrada[]
  aoFechar: () => void
  aoDesfazer?: () => void // registro errado? desfaz e some com a taça
}) {
  const aberta = conquistas.length > 0
  // A maior conquista (último nível) é a estrela da festa
  const principal = conquistas.reduce<ConquistaCelebrada | null>(
    (maior, c) => (!maior || c.nivel > maior.nivel ? c : maior),
    null
  )

  useEffect(() => {
    if (!aberta) return
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!reduzir) soltarConfetes()
    navigator.vibrate?.([80, 40, 160])
  }, [aberta])

  return (
    <AnimatePresence>
      {aberta && principal && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--lavado)]/85 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={aoFechar}
          role="dialog"
          aria-modal="true"
          aria-label="Novo recorde"
        >
          <motion.div
            className="adesivo-grande w-full max-w-sm bg-white px-6 pt-8 pb-6 text-center"
            initial={{ scale: 0.6, y: 40, rotate: -4 }}
            animate={{ scale: 1, y: 0, rotate: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 14 }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="display text-[44px]">
              {principal.tipo === "PRIMEIRA" ? (
                <>
                  Bem-vindo,
                  <br />
                  recruta!
                </>
              ) : (
                <>
                  Novo
                  <br />
                  recorde!
                </>
              )}
            </p>

            <motion.div
              className="my-5 flex justify-center"
              initial={{ rotate: -20, scale: 0.3 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 160, damping: 9, delay: 0.15 }}
            >
              <Taca nivel={principal.nivel} tipo={principal.tipo} tamanho={150} crescer={false} />
            </motion.div>

            <p className="rotulo inline-block rounded-full border border-black bg-[var(--sol)] px-3 py-1.5">
              Taça {categoriaTaca(principal.nivel, principal.tipo).nome} · Nº {principal.nivel}
            </p>

            <ul className="mt-4 space-y-2">
              {conquistas.map((c) => (
                <li
                  key={c.tipo}
                  className="flex items-center justify-between rounded-full border border-black px-4 py-2.5 text-sm font-bold"
                >
                  <span>{NOME_TIPO_TACA[c.tipo]}</span>
                  <span>{c.valor} flecas</span>
                </li>
              ))}
            </ul>

            <button onClick={aoFechar} className="pilula pilula-cheia mt-5 w-full !py-4 text-base" autoFocus>
              SELVA!
            </button>
            {aoDesfazer && (
              <button onClick={aoDesfazer} className="mt-3 text-sm font-bold underline underline-offset-4">
                Errei o número, desfazer
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
