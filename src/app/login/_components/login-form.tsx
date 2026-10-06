"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { estiloBotaoPrincipal, estiloCampo, estiloRotulo } from "@/components/cartao-acesso"

export function LoginForm() {
  const [carregando, setCarregando] = useState(false)

  const entrar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const dados = new FormData(e.currentTarget)
    setCarregando(true)

    const resultado = await signIn("credentials", {
      email: dados.get("email"),
      password: dados.get("password"),
      redirect: false,
    })

    if (!resultado || resultado.error) {
      toast.error("Email ou senha incorretos")
      setCarregando(false)
      return
    }

    // Recarrega a página inteira para aplicar o tema (azul/rosa) do usuário
    window.location.href = "/"
  }

  return (
    <form onSubmit={entrar} className="space-y-4">
      <div>
        <label htmlFor="email" className={estiloRotulo}>Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" placeholder="seu@email.com" className={estiloCampo} />
      </div>
      <div>
        <label htmlFor="password" className={estiloRotulo}>Senha</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" placeholder="••••••" className={estiloCampo} />
      </div>
      <button type="submit" disabled={carregando} className={estiloBotaoPrincipal}>
        {carregando ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar"}
      </button>
    </form>
  )
}
