"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Dumbbell, Shield, Trophy } from "lucide-react"

export function NavInferior({ admin }: { admin: boolean }) {
  const pathname = usePathname()

  const itens = [
    { href: "/", rotulo: "Pagar", icone: Dumbbell },
    { href: "/historico", rotulo: "Histórico", icone: Trophy },
    ...(admin ? [{ href: "/admin/usuarios", rotulo: "Admin", icone: Shield }] : []),
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
      <ul className="flex gap-1 rounded-full border border-black bg-white p-1.5">
        {itens.map(({ href, rotulo, icone: Icone }) => {
          const ativo = href === "/" ? pathname === "/" : pathname.startsWith(href)
          return (
            <li key={href}>
              <Link
                href={href}
                className={`rotulo flex items-center gap-2 rounded-full px-4 py-3 transition ${
                  ativo ? "bg-black text-white" : "text-black hover:bg-[var(--nevoa)]"
                }`}
                aria-current={ativo ? "page" : undefined}
              >
                <Icone className="h-4 w-4" />
                {rotulo}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
