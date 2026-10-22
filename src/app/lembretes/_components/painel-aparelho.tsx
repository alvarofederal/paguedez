"use client"

import { useEffect, useState } from "react"
import { Bell, BellOff, Loader2, Send } from "lucide-react"
import { toast } from "sonner"
import { enviarTesteAction, removerInscricaoAction, salvarInscricaoAction } from "@/app/_actions/lembretes"
import {
  cancelarInscricao,
  ehIOS,
  inscreverNoPush,
  inscricaoAtual,
  nomeDoNavegador,
  verificarSuporte,
  type SuporteApp,
} from "@/lib/push-cliente"

type Estado = { suporte: SuporteApp; permissao: NotificationPermission | "indisponivel"; inscrito: boolean }

// "Este aparelho": liga/desliga as notificações no navegador atual e permite mandar uma notificação de teste.
export function PainelAparelho({ configurado, chavePublica, aparelhosNaConta }: { configurado: boolean; chavePublica: string | null; aparelhosNaConta: number }) {
  const [estado, setEstado] = useState<Estado | null>(null)
  const [ocupado, setOcupado] = useState<"ativar" | "desativar" | "testar" | null>(null)
  // Erro que fica na tela até a próxima tentativa (o aviso rápido sumia antes de dar para ler)
  const [falha, setFalha] = useState<{ titulo: string; detalhe?: string } | null>(null)

  useEffect(() => {
    let cancelado = false
    ;(async () => {
      const suporte = verificarSuporte()
      if (suporte !== "ok") return void (!cancelado && setEstado({ suporte, permissao: "indisponivel", inscrito: false }))

      const atual = await inscricaoAtual()
      if (cancelado) return
      setEstado({ suporte, permissao: Notification.permission, inscrito: atual !== null && Notification.permission === "granted" })
      // Repara o servidor em silêncio caso ele tenha perdido este aparelho
      if (atual && configurado && Notification.permission === "granted") void salvarInscricaoAction(atual.toJSON()).catch(() => undefined)
    })()
    return () => {
      cancelado = true
    }
  }, [configurado])

  const ativar = async () => {
    if (!chavePublica) return
    setOcupado("ativar")
    setFalha(null)
    try {
      const r = await inscreverNoPush(chavePublica)
      if (!r.ok) {
        setEstado((e) => (e ? { ...e, permissao: Notification.permission } : e))
        const titulo =
          r.motivo === "negada"
            ? "Permissão negada. Libere as notificações nas configurações do navegador para este site."
            : "Não foi possível ativar as notificações neste aparelho."
        setFalha({ titulo, detalhe: `${nomeDoNavegador()} — etapa "${r.etapa}": ${r.detalhe}` })
        toast.error(titulo, { duration: 8000 })
        return
      }
      const salvo = await salvarInscricaoAction(r.inscricao.toJSON())
      if (salvo.erro) {
        setFalha({ titulo: "O aparelho aceitou, mas o servidor não conseguiu salvar.", detalhe: `${nomeDoNavegador()} — ${salvo.erro}` })
        return void toast.error(salvo.erro, { duration: 8000 })
      }
      setEstado((e) => (e ? { ...e, permissao: "granted", inscrito: true } : e))
      toast.success("Notificações ativadas neste aparelho!")
    } catch (erro) {
      console.error("Falha inesperada ao ativar:", erro)
      setFalha({ titulo: "Não foi possível ativar agora.", detalhe: `${nomeDoNavegador()} — ${(erro as Error)?.message ?? String(erro)}` })
      toast.error("Não foi possível ativar agora. Veja o detalhe na tela.", { duration: 8000 })
    } finally {
      setOcupado(null)
    }
  }

  const desativar = async () => {
    setOcupado("desativar")
    try {
      const endpoint = await cancelarInscricao()
      if (endpoint) await removerInscricaoAction(endpoint)
      setEstado((e) => (e ? { ...e, inscrito: false } : e))
      toast.success("Notificações desativadas neste aparelho")
    } catch {
      toast.error("Não foi possível desativar agora. Tente de novo.")
    } finally {
      setOcupado(null)
    }
  }

  const testar = async () => {
    setOcupado("testar")
    try {
      setFalha(null)
      const r = await enviarTesteAction()
      if (r.erro) {
        setFalha({ titulo: r.erro })
        toast.error(r.erro, { duration: 8000 })
      } else toast.success("Teste enviado! A notificação deve aparecer em instantes.")
    } catch (erro) {
      console.error("Falha inesperada no teste:", erro)
      setFalha({ titulo: "Não foi possível enviar o teste agora.", detalhe: (erro as Error)?.message })
    } finally {
      setOcupado(null)
    }
  }

  return (
    <section className="adesivo-grande bg-white p-5">
      <h2 className="rotulo mb-3">Este aparelho</h2>

      {!configurado ? (
        <p className="rounded-[14px] border border-black bg-[var(--sol)] p-3 text-sm font-bold">
          As notificações ainda não estão configuradas no servidor. Assim que forem, o botão de ativar aparece aqui.
        </p>
      ) : !estado ? (
        <p className="flex items-center gap-2 text-sm font-medium">
          <Loader2 className="h-4 w-4 animate-spin" /> Verificando o seu aparelho...
        </p>
      ) : estado.suporte === "nao-suportado" ? (
        <p className="text-sm font-medium">Este navegador não oferece notificações push. Experimente o Chrome, o Edge, o Firefox ou o Safari atualizado.</p>
      ) : estado.suporte === "instalar-no-iphone" ? (
        <div className="space-y-2 text-sm font-medium">
          <p className="font-bold">No iPhone, instale o app primeiro:</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Abra este site no <strong>Safari</strong>.
            </li>
            <li>
              Toque em <strong>Compartilhar</strong> e depois em <strong>Adicionar à Tela de Início</strong>.
            </li>
            <li>Abra o Pague Dez pelo novo ícone e volte a esta tela.</li>
          </ol>
          <p className="text-[var(--texto-3)]">É uma regra da Apple: o push só funciona em sites instalados na tela inicial (iOS 16.4 ou mais novo).</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="flex items-center gap-2 font-bold">
            {estado.inscrito ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            {estado.inscrito ? "Notificações ativadas" : estado.permissao === "denied" ? "Bloqueadas no navegador" : "Notificações desativadas"}
          </p>

          {estado.permissao === "denied" && !estado.inscrito && (
            <p className="text-sm font-medium">
              Você bloqueou as notificações deste site. Para liberar, toque no cadeado ao lado do endereço, entre em <strong>Configurações do site</strong> e permita{" "}
              <strong>Notificações</strong>. Depois volte aqui.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {estado.inscrito ? (
              <>
                <button onClick={testar} disabled={ocupado !== null} className="pilula pilula-cheia">
                  {ocupado === "testar" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Enviar notificação de teste
                </button>
                <button onClick={desativar} disabled={ocupado !== null} className="pilula pilula-fantasma">
                  {ocupado === "desativar" ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Desativar neste aparelho
                </button>
              </>
            ) : (
              <button onClick={ativar} disabled={ocupado !== null || estado.permissao === "denied"} className="pilula pilula-cheia">
                {ocupado === "ativar" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />} Ativar neste aparelho
              </button>
            )}
          </div>

          {falha && (
            <div role="alert" className="rounded-[14px] border border-black bg-[var(--brasa)] p-3 text-sm text-white">
              <p className="font-bold">{falha.titulo}</p>
              {falha.detalhe && <p className="mt-1 break-words text-xs opacity-90">Detalhe técnico: {falha.detalhe}</p>}
            </div>
          )}

          {aparelhosNaConta > 0 && (
            <p className="text-xs text-[var(--texto-3)]">
              {aparelhosNaConta} {aparelhosNaConta === 1 ? "aparelho recebe" : "aparelhos recebem"} os lembretes da sua conta.
              {ehIOS() ? "" : " Cada navegador ou computador precisa ser ativado separadamente."}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
