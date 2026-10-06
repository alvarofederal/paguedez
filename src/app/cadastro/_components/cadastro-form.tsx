"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cadastrar } from "@/app/_actions/usuarios"
import { CamposUsuario } from "@/components/campos-usuario"
import { estiloBotaoPrincipal } from "@/components/cartao-acesso"

type Sexo = "MASCULINO" | "FEMININO"

export function CadastroForm() {
  const [carregando, setCarregando] = useState(false)
  const [sexo, setSexo] = useState<Sexo | null>(null)

  const escolherSexo = (valor: Sexo) => {
    setSexo(valor)
    // Prévia do tema (azul ou rosa) já na tela de cadastro
    document.documentElement.dataset.sexo = valor
  }

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!sexo) {
      toast.error("Escolha o sexo")
      return
    }
    const form = new FormData(e.currentTarget)
    const dados = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      sexo,
    }

    setCarregando(true)
    const { erro } = await cadastrar(dados)
    if (erro) {
      toast.error(erro)
      setCarregando(false)
      return
    }

    const login = await signIn("credentials", { email: dados.email, password: dados.password, redirect: false })
    if (!login || login.error) {
      toast.success("Conta criada! Faça login.")
      window.location.href = "/login"
      return
    }
    window.location.href = "/"
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <CamposUsuario sexo={sexo} aoMudarSexo={escolherSexo} />
      <button type="submit" disabled={carregando} className={estiloBotaoPrincipal}>
        {carregando ? <Loader2 className="h-5 w-5 animate-spin" /> : "Alistar-se"}
      </button>
    </form>
  )
}
