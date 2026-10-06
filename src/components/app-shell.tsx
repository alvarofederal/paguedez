import Link from "next/link"
import { BotaoSair } from "./botao-sair"
import { Marca } from "./marca"
import { NavInferior } from "./nav-inferior"
import { FaixaRolante } from "./faixa-rolante"

type Props = {
  usuario: { name: string; papel: "ADMIN" | "USUARIO" }
  children: React.ReactNode
}

export function AppShell({ usuario, children }: Props) {
  const primeiroNome = usuario.name.split(" ")[0]

  return (
    <div className="flex min-h-dvh flex-col">
      <FaixaRolante />
      <header className="mx-auto flex w-full max-w-xl items-center justify-between px-4 py-4">
        <Link href="/" aria-label="Início">
          <Marca />
        </Link>
        <div className="flex items-center gap-2">
          <span className="pilula pilula-fantasma max-w-36 truncate !px-3 !py-2 text-xs">Sd. {primeiroNome}</span>
          <BotaoSair />
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-32">{children}</main>

      <NavInferior admin={usuario.papel === "ADMIN"} />
    </div>
  )
}
