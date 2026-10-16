"use client"

import { useEffect, useState } from "react"
import confetti from "canvas-confetti"
import { AnimatePresence, motion } from "framer-motion"
import { Insignia } from "@/components/insignia"
import type { Patente } from "@/lib/patentes"

const CORES = ["#4da2ff", "#55db9c", "#e9ccff", "#fb4903", "#ffd731", "#5c4ade", "#ff6fb5"]

/** Tela de promoção: aparece uma única vez, quando a patente sobe (o servidor só envia `promocao` na visita em que subiu). */
export function PromocaoPatente({ patente, titulo, lema }: { patente: Patente; titulo: string; lema: string }) {
  const [aberta, setAberta] = useState(true)

  useEffect(() => {
    if (!aberta) return
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      confetti({ particleCount: 200, spread: 120, startVelocity: 55, origin: { y: 0.6 }, colors: CORES, zIndex: 60 })
    }
    navigator.vibrate?.([80, 40, 160])
  }, [aberta])

  return (
    <AnimatePresence>
      {aberta && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--lavado)]/85 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setAberta(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Promovido a ${titulo}`}
        >
          <motion.div
            className="adesivo-grande w-full max-w-sm bg-white px-6 pt-8 pb-6 text-center"
            initial={{ scale: 0.6, y: 40, rotate: -4 }}
            animate={{ scale: 1, y: 0, rotate: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 14 }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="display text-[38px]">Promovido!</p>
            <motion.div
              className="my-5 flex justify-center"
              initial={{ rotate: -25, scale: 0.3 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 160, damping: 9, delay: 0.15 }}
            >
              <Insignia patente={patente} tamanho={150} />
            </motion.div>
            <p className="display text-4xl">{titulo}</p>
            <p className="mt-2 text-sm font-medium">{lema}</p>
            <button onClick={() => setAberta(false)} className="pilula pilula-cheia mt-5 w-full !py-4 text-base" autoFocus>
              SELVA!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
