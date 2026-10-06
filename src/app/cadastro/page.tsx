import Link from "next/link"
import { redirect } from "next/navigation"
import { usuarioAtual } from "@/lib/auth"
import { CartaoAcesso } from "@/components/cartao-acesso"
import { CadastroForm } from "./_components/cadastro-form"

export const metadata = { title: "Alistamento" }

export default async function CadastroPage() {
  if (await usuarioAtual()) redirect("/") // sessão de usuário desativado não conta

  return (
    <CartaoAcesso subtitulo="Aliste-se e comece a pagar suas flecas">
      <CadastroForm />
      <p className="mt-6 text-center text-sm">
        Já é da tropa?{" "}
        <Link href="/login" className="font-bold underline underline-offset-4">
          Entrar
        </Link>
      </p>
    </CartaoAcesso>
  )
}
