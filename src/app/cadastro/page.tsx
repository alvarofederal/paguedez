import Link from "next/link"
import { redirect } from "next/navigation"
import { usuarioAtual } from "@/lib/auth"
import { CartaoAcesso } from "@/components/cartao-acesso"
import { proximoSeguro } from "@/lib/comunidade"
import { CadastroForm } from "./_components/cadastro-form"

export const metadata = { title: "Alistamento" }

export default async function CadastroPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const proximo = proximoSeguro((await searchParams).next) // volta para o convite depois de criar a conta
  if (await usuarioAtual()) redirect(proximo) // sessão de usuário desativado não conta

  return (
    <CartaoAcesso subtitulo="Aliste-se e comece a pagar suas flecas">
      <CadastroForm proximo={proximo} />
      <p className="mt-6 text-center text-sm">
        Já é da tropa?{" "}
        <Link href={proximo === "/" ? "/login" : `/login?next=${encodeURIComponent(proximo)}`} className="font-bold underline underline-offset-4">
          Entrar
        </Link>
      </p>
    </CartaoAcesso>
  )
}
