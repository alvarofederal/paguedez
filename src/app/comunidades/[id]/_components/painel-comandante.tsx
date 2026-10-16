"use client"

import { useState, useTransition } from "react"
import { Check, Copy, Loader2, Send, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { atualizarComunidadeAction, excluirComunidadeAction, removerMembroAction } from "@/app/_actions/social"
import { CamposComunidade, type EstadoComunidade } from "@/components/campos-comunidade"
import { urlWhatsapp } from "@/lib/convites"

type Membro = { userId: string; name: string }

// Tudo que só o comandante (dono) pode fazer: editar, escolher o nível de visibilidade,
// abrir/fechar o link de entrada, remover membros e excluir o pelotão.
export function PainelComandante({
  comunidadeId,
  inicial,
  entradaAtiva: entradaInicial,
  linkEntrada,
  membros,
}: {
  comunidadeId: string
  inicial: EstadoComunidade
  entradaAtiva: boolean
  linkEntrada: string
  membros: Membro[]
}) {
  const [estado, setEstado] = useState(inicial)
  const [entradaAtiva, setEntradaAtiva] = useState(entradaInicial)
  const [pendente, iniciar] = useTransition()
  const [copiado, setCopiado] = useState(false)

  const salvar = (e: React.FormEvent) => {
    e.preventDefault()
    iniciar(async () => {
      const r = await atualizarComunidadeAction(
        comunidadeId,
        { nome: estado.nome, descricao: estado.descricao || undefined, cor: estado.cor, nivelVisibilidade: estado.nivel },
        entradaAtiva
      )
      if (r.erro) toast.error(r.erro)
      else toast.success("Pelotão atualizado")
    })
  }

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(linkEntrada)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      toast.error("Não foi possível copiar. Selecione o link e copie manualmente.")
    }
  }

  const remover = (m: Membro) => {
    if (!confirm(`Remover ${m.name} do pelotão?`)) return
    iniciar(async () => {
      const r = await removerMembroAction(comunidadeId, m.userId)
      if (r.erro) toast.error(r.erro)
      else toast.success(`${m.name} removido`)
    })
  }

  const excluir = () => {
    if (!confirm("Excluir o pelotão? Todos os membros saem e o ranking é apagado. Isso não dá para desfazer.")) return
    iniciar(async () => {
      const r = await excluirComunidadeAction(comunidadeId)
      if (r.erro) return void toast.error(r.erro)
      toast.success("Pelotão excluído")
      window.location.href = "/comunidades"
    })
  }

  const texto = `Soldado! Venha para o meu pelotão no Pague Dez 💪\n${linkEntrada}`

  return (
    <section className="mt-10 space-y-6">
      <h2 className="display text-4xl">Comando</h2>

      <div className="adesivo-grande bg-white p-5">
        <h3 className="rotulo mb-2">Link de entrada</h3>
        <p className="mb-3 text-sm font-medium">Qualquer pessoa com este link entra no pelotão. Bom para grupo de academia, quartel ou cursinho.</p>
        <p className="mb-3 break-all rounded-[14px] border border-black bg-[var(--nevoa)] p-2 text-xs">{linkEntrada}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={copiar} className="pilula pilula-cheia !px-4 !py-2 text-xs">
            {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copiado ? "Copiado!" : "Copiar"}
          </button>
          <a href={urlWhatsapp(texto)} className="pilula pilula-fantasma !px-4 !py-2 text-xs">
            <Send className="h-4 w-4" /> Compartilhar no WhatsApp
          </a>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" checked={entradaAtiva} onChange={(e) => setEntradaAtiva(e.target.checked)} className="h-4 w-4 accent-black" />
          Link de entrada aberto
        </label>
        <p className="mt-1 text-xs text-[var(--texto-3)]">Desmarque e salve para fechar o link. Convites diretos pelo WhatsApp continuam funcionando.</p>
      </div>

      <form onSubmit={salvar} className="adesivo-grande space-y-4 bg-white p-5">
        <h3 className="rotulo">Dados e visibilidade</h3>
        <CamposComunidade valor={estado} aoMudar={setEstado} desabilitado={pendente} />
        <button type="submit" disabled={pendente} className="pilula pilula-cheia w-full !py-4 text-base">
          {pendente ? <Loader2 className="h-5 w-5 animate-spin" /> : null} Salvar alterações
        </button>
      </form>

      {membros.length > 0 && (
        <div className="adesivo p-5">
          <h3 className="rotulo mb-2">Membros</h3>
          <ul className="divide-y divide-black/15">
            {membros.map((m) => (
              <li key={m.userId} className="flex items-center justify-between gap-3 py-2">
                <span className="truncate font-bold">{m.name}</span>
                <button onClick={() => remover(m)} disabled={pendente} className="pilula pilula-fantasma !px-3 !py-1.5 text-xs">
                  Remover
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={excluir} disabled={pendente} className="pilula w-full !py-3 text-sm" style={{ background: "var(--brasa)", color: "#fff" }}>
        <Trash2 className="h-4 w-4" /> Excluir pelotão
      </button>
    </section>
  )
}
