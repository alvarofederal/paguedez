"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Dumbbell, Shield, Swords, Trophy, Users } from "lucide-react"

export function NavInferior({
  admin,
  social = false,
  pelotaoHref = null,
  pelotoes = 0,
}: {
  admin: boolean
  social?: boolean
  /** null = o usuário ainda não tem pelotão, então o item nem aparece */
  pelotaoHref?: string | null
  pelotoes?: number
}) {
  const pathname = usePathname()

  const itens: { href: string; rotulo: string; icone: typeof Users; prefixo?: string }[] = [
    { href: "/", rotulo: "Pagar", icone: Dumbbell },
    { href: "/historico", rotulo: "Histórico", icone: Trophy },
    ...(social ? [{ href: "/tropa", rotulo: "Tropa", icone: Users }] : []),
    ...(social && pelotaoHref ? [{ href: pelotaoHref, rotulo: pelotoes > 1 ? "Pelotões" : "Pelotão", icone: Swords, prefixo: "/comunidades" }] : []),
    ...(admin ? [{ href: "/admin/usuarios", rotulo: "Admin", icone: Shield }] : []),
  ]

  const compacto = itens.length >= 4

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
      <ul className="flex gap-1 rounded-full border border-black bg-white p-1.5">
        {itens.map(({ href, rotulo, icone: Icone, prefixo }) => {
          const base = prefixo ?? href // o item do pelotão aponta para um id, mas fica ativo em qualquer /comunidades/...
          const ativo = base === "/" ? pathname === "/" : pathname.startsWith(base)
          // Com 4+ itens não cabe texto em todos no celular: só o item ativo mostra o nome, os outros ficam só com o ícone
          const mostrarNome = !compacto || ativo
          return (
            <li key={href}>
              <Link
                href={href}
                className={`rotulo flex items-center gap-2 rounded-full ${compacto && !ativo ? "px-3.5" : "px-4"} py-3 transition ${
                  ativo ? "bg-black text-white" : "text-black hover:bg-[var(--nevoa)]"
                }`}
                aria-current={ativo ? "page" : undefined}
                aria-label={rotulo}
                title={rotulo}
              >
                <Icone className="h-4 w-4" />
                {mostrarNome && rotulo}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
