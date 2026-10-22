import Link from "next/link"
import { Bell } from "lucide-react"
import { BotaoSair } from "./botao-sair"
import { Marca } from "./marca"
import { NavInferior } from "./nav-inferior"
import { FaixaRolante } from "./faixa-rolante"
import { socialAtivo } from "@/lib/social-flag"
import { meusPelotoesIds } from "@/server/comunidades"
import { contarLembretesAtivos } from "@/server/lembretes"
import { contarInscricoes } from "@/server/push"

type Props = {
  usuario: { id?: string; name: string; papel: "ADMIN" | "USUARIO" }
  children: React.ReactNode
}

export async function AppShell({ usuario, children }: Props) {
  const primeiroNome = usuario.name.split(" ")[0]
  const social = socialAtivo()
  // "Pelotão" só aparece no menu depois que o usuário tem um (criar/entrar continua em Tropa)
  const pelotoes = social && usuario.id ? await meusPelotoesIds(usuario.id) : []
  // Sino dos lembretes: extra, se a consulta falhar ele aparece sem selo
  const [lembretes, aparelhos] = usuario.id
    ? await Promise.all([contarLembretesAtivos(usuario.id).catch(() => 0), contarInscricoes(usuario.id).catch(() => 0)])
    : [0, 0]
  const faltaAtivar = lembretes > 0 && aparelhos === 0
  const selo = faltaAtivar ? "!" : lembretes > 0 ? String(lembretes) : null

  return (
    <div className="flex min-h-dvh flex-col">
      <FaixaRolante />
      <header className="mx-auto flex w-full max-w-xl items-center justify-between px-4 py-4">
        <Link href="/" aria-label="Início">
          <Marca />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/lembretes"
            aria-label={faltaAtivar ? "Lembretes: falta ativar o aparelho" : lembretes > 0 ? `Lembretes: ${lembretes} ativos` : "Lembretes"}
            title="Lembretes"
            className="pilula pilula-fantasma relative !px-3 !py-2 text-xs"
          >
            <Bell className="h-4 w-4" />
            {/* no celular só cabe o ícone com o selo; o card da tela Pagar tem o botão por extenso */}
            <span className="hidden sm:inline">Lembretes</span>
            {selo && (
              <span
                className={`absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border border-black px-1 text-[11px] font-bold leading-none ${faltaAtivar ? "bg-[var(--brasa)] text-white" : "bg-[var(--menta)]"}`}
              >
                {selo}
              </span>
            )}
          </Link>
          <span className="pilula pilula-fantasma max-w-28 truncate !px-3 !py-2 text-xs">Sd. {primeiroNome}</span>
          <BotaoSair />
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-32">{children}</main>

      <NavInferior admin={usuario.papel === "ADMIN"} social={social} pelotaoHref={pelotoes.length === 0 ? null : pelotoes.length === 1 ? `/comunidades/${pelotoes[0]}` : "/comunidades"} pelotoes={pelotoes.length} />
    </div>
  )
}
