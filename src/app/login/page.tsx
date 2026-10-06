import Link from "next/link"
import { redirect } from "next/navigation"
import { usuarioAtual } from "@/lib/auth"
import { CartaoAcesso } from "@/components/cartao-acesso"
import { LoginForm } from "./_components/login-form"

export const metadata = { title: "Entrar" }

export default async function LoginPage() {
  if (await usuarioAtual()) redirect("/") // sessão de usuário desativado não conta

  return (
    <CartaoAcesso subtitulo="Apresente-se, soldado!">
      <LoginForm />
      <p className="mt-6 text-center text-sm">
        Ainda não se alistou?{" "}
        <Link href="/cadastro" className="font-bold underline underline-offset-4">
          Criar conta
        </Link>
      </p>
    </CartaoAcesso>
  )
}
