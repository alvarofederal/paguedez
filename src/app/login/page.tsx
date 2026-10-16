import Link from "next/link"
import { redirect } from "next/navigation"
import { usuarioAtual } from "@/lib/auth"
import { CartaoAcesso } from "@/components/cartao-acesso"
import { proximoSeguro } from "@/lib/comunidade"
import { LoginForm } from "./_components/login-form"

export const metadata = { title: "Entrar" }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const proximo = proximoSeguro((await searchParams).next)
  if (await usuarioAtual()) redirect(proximo) // sessão de usuário desativado não conta

  return (
    <CartaoAcesso subtitulo="Apresente-se, soldado!">
      <LoginForm proximo={proximo} />
      <p className="mt-6 text-center text-sm">
        Ainda não se alistou?{" "}
        <Link href={proximo === "/" ? "/cadastro" : `/cadastro?next=${encodeURIComponent(proximo)}`} className="font-bold underline underline-offset-4">
          Criar conta
        </Link>
      </p>
    </CartaoAcesso>
  )
}
