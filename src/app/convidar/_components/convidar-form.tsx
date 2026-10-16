"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Copy, Loader2, Send } from "lucide-react"
import { toast } from "sonner"
import { criarConviteAction } from "@/app/_actions/social"
import { estiloCampo, estiloRotulo } from "@/components/cartao-acesso"
import { primeiroNome } from "@/lib/comunidade"
import { MODELOS_MENSAGEM, mensagemPadrao } from "@/lib/convites"
import { abrirWhatsapp } from "@/lib/abrir-whatsapp"

type Pelotao = { id: string; nome: string }

export function ConvidarForm({ meuNome, pelotoes, pelotaoInicial }: { meuNome: string; pelotoes: Pelotao[]; pelotaoInicial?: string }) {
  const [apelido, setApelido] = useState("")
  const [telefone, setTelefone] = useState("")
  const [pelotaoId, setPelotaoId] = useState(pelotaoInicial ?? "")
  const [modelo, setModelo] = useState(0)
  const [personalizada, setPersonalizada] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [pronto, setPronto] = useState<{ link: string; whatsappUrl: string; reenviado: boolean } | null>(null)
  const [copiado, setCopiado] = useState(false)
  const cartaoRef = useRef<HTMLDivElement>(null)

  // Mostra o resultado na tela assim que o convite é criado (a página não é abandonada)
  useEffect(() => {
    if (pronto) cartaoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [pronto])

  const quem = primeiroNome(meuNome)
  const nomeAmigo = apelido.trim() || "amigo"
  const pelotao = pelotoes.find((p) => p.id === pelotaoId)
  // Mensagem sugerida; se o usuário editar, vale o texto dele. O link entra sempre no final, pelo servidor.
  const sugerida = pelotao ? mensagemPadrao(nomeAmigo, quem, pelotao.nome) : MODELOS_MENSAGEM[modelo](nomeAmigo, quem)
  const mensagem = personalizada ?? sugerida

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnviando(true)
    try {
      const r = await criarConviteAction({ apelido, telefone, mensagem, comunidadeId: pelotaoId || null })
      if (r.erro !== null || !("whatsappUrl" in r)) {
        toast.error(r.erro ?? "Não foi possível criar o convite")
        return
      }
      setPronto({ link: r.link, whatsappUrl: r.whatsappUrl, reenviado: r.reenviado })
      abrirWhatsapp(r.whatsappUrl)
    } catch {
      toast.error("Não foi possível criar o convite agora. Tente de novo em instantes.")
    } finally {
      setEnviando(false)
    }
  }

  const copiar = async () => {
    if (!pronto) return
    try {
      await navigator.clipboard.writeText(pronto.link)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      toast.error("Não foi possível copiar. Selecione o link e copie manualmente.")
    }
  }

  return (
    <>
      <form onSubmit={enviar} className="adesivo-grande space-y-4 bg-white p-5">
        <div>
          <label htmlFor="apelido" className={estiloRotulo}>Apelido do amigo</label>
          <input id="apelido" value={apelido} onChange={(e) => setApelido(e.target.value)} required minLength={2} maxLength={40} placeholder="Ex.: Cabo Silva" className={estiloCampo} />
        </div>

        <div>
          <label htmlFor="telefone" className={estiloRotulo}>WhatsApp do amigo</label>
          <input id="telefone" type="tel" inputMode="tel" autoComplete="off" value={telefone} onChange={(e) => setTelefone(e.target.value)} required placeholder="(11) 99999-8888" className={estiloCampo} />
          <p className="mt-1.5 ml-4 text-xs text-[var(--texto-3)]">Usado só para abrir a conversa. O número completo não fica guardado.</p>
        </div>

        {pelotoes.length > 0 && (
          <div>
            <label htmlFor="pelotao" className={estiloRotulo}>Convidar para um pelotão (opcional)</label>
            <select id="pelotao" value={pelotaoId} onChange={(e) => setPelotaoId(e.target.value)} className={estiloCampo}>
              <option value="">Só amizade, sem pelotão</option>
              {pelotoes.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="mensagem" className={estiloRotulo}>Mensagem</label>
          {!pelotao && (
            <div className="mb-2 flex flex-wrap gap-2">
              {MODELOS_MENSAGEM.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setModelo(i)
                    setPersonalizada(null)
                  }}
                  className={`pilula ${personalizada === null && modelo === i ? "pilula-cheia" : "pilula-fantasma"} !px-3 !py-1.5 text-xs`}
                >
                  Modelo {i + 1}
                </button>
              ))}
            </div>
          )}
          <textarea
            id="mensagem"
            value={mensagem}
            onChange={(e) => setPersonalizada(e.target.value)}
            rows={4}
            maxLength={240}
            className="w-full rounded-[20px] border border-black bg-white px-4 py-3 font-medium outline-none focus:bg-[var(--lavado)]"
          />
          <p className="mt-1.5 ml-4 text-xs text-[var(--texto-3)]">O seu link de convite é colocado no final da mensagem automaticamente.</p>
        </div>

        <button type="submit" disabled={enviando} className="pilula pilula-cheia w-full !py-4 text-base">
          {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          Mandar pagar dez no WhatsApp
        </button>
      </form>

      {pronto && (
        <div ref={cartaoRef} className="adesivo mt-4 bg-[var(--menta)] p-5" role="status">
          <p className="font-bold">{pronto.reenviado ? "Esse amigo já tinha convite: gerei um link novo." : "Convite criado!"}</p>
          <p className="mt-1 text-sm">O WhatsApp abre em outra aba ou no aplicativo. Se não abriu, toque em <strong>Abrir WhatsApp</strong>:</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={pronto.whatsappUrl} target="_blank" rel="noopener noreferrer" className="pilula pilula-cheia">
              <Send className="h-4 w-4" /> Abrir WhatsApp
            </a>
            <button type="button" onClick={copiar} className="pilula pilula-fantasma">
              {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copiado ? "Copiado!" : "Copiar link"}
            </button>
          </div>
          <p className="mt-3 break-all rounded-[14px] border border-black bg-white p-2 text-xs">{pronto.link}</p>
        </div>
      )}
    </>
  )
}
