"use client"

import { useRef, useState } from "react"
import { Loader2, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { adminCriarUsuario } from "@/app/_actions/usuarios"
import { CamposUsuario } from "@/components/campos-usuario"
import { estiloBotaoPrincipal } from "@/components/cartao-acesso"

type Sexo = "MASCULINO" | "FEMININO"

export function NovoUsuarioForm() {
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [sexo, setSexo] = useState<Sexo | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  if (!aberto) {
    return (
      <button onClick={() => setAberto(true)} className={estiloBotaoPrincipal}>
        <UserPlus className="h-5 w-5" /> Novo usuário
      </button>
    )
  }

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!sexo) {
      toast.error("Escolha o sexo")
      return
    }
    const form = new FormData(e.currentTarget)
    setCarregando(true)
    const { erro } = await adminCriarUsuario({
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      sexo,
    })
    setCarregando(false)

    if (erro) {
      toast.error(erro)
      return
    }
    toast.success("Usuário cadastrado!")
    formRef.current?.reset()
    setSexo(null)
    setAberto(false)
  }

  return (
    <form ref={formRef} onSubmit={enviar} className="adesivo-grande space-y-4 bg-white p-5">
      <CamposUsuario sexo={sexo} aoMudarSexo={setSexo} />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="pilula pilula-fantasma flex-1 !py-4"
        >
          Cancelar
        </button>
        <button type="submit" disabled={carregando} className={`${estiloBotaoPrincipal} flex-1`}>
          {carregando ? <Loader2 className="h-5 w-5 animate-spin" /> : "Salvar"}
        </button>
      </div>
    </form>
  )
}
