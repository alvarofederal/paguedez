import Link from "next/link"
import { Bell, BellRing, Settings2 } from "lucide-react"

type Props = {
  /** horários ("HH:MM") dos lembretes ativos, em ordem */
  horarios: string[]
  /** quantos aparelhos (navegadores) da conta estão inscritos no push */
  aparelhos: number
}

/**
 * Card fixo na tela Pagar: sempre diz em que passo dos lembretes o usuário está.
 * Antes ele sumia ao criar o primeiro lembrete, e ficava só uma linha pequena — parecia que a função tinha desaparecido.
 */
export function LembretesCard({ horarios, aparelhos }: Props) {
  const temLembretes = horarios.length > 0
  const resumo = horarios.slice(0, 4).join(" · ") + (horarios.length > 4 ? ` · +${horarios.length - 4}` : "")

  // 1) nada configurado
  if (!temLembretes && aparelhos === 0) {
    return (
      <Cartao fundo="var(--menta)" titulo="Lembrete diário" texto="Receba uma notificação na hora de pagar suas flecas, mesmo com o app fechado.">
        <Botao icone={<Bell className="h-4 w-4" />}>Ativar lembrete</Botao>
      </Cartao>
    )
  }

  // 2) criou horários, mas nenhum aparelho recebe: nada vai chegar
  if (temLembretes && aparelhos === 0) {
    return (
      <Cartao
        fundo="var(--brasa)"
        claro
        titulo="Falta ativar o aparelho"
        texto={`Você tem ${horarios.length} ${horarios.length === 1 ? "lembrete" : "lembretes"} (${resumo}), mas nenhum aparelho está ativado — as notificações não vão chegar.`}
      >
        <Botao icone={<BellRing className="h-4 w-4" />}>Ativar neste aparelho</Botao>
      </Cartao>
    )
  }

  // 3) aparelho ativo, mas sem horários
  if (!temLembretes) {
    return (
      <Cartao fundo="var(--sol)" titulo="Escolha um horário" texto="O aparelho está pronto para receber. Falta criar pelo menos um lembrete na agenda.">
        <Botao icone={<Settings2 className="h-4 w-4" />}>Criar lembrete</Botao>
      </Cartao>
    )
  }

  // 4) tudo certo
  return (
    <Cartao
      fundo="var(--menta)"
      titulo="Lembretes ativos"
      texto={`${horarios.length} ${horarios.length === 1 ? "lembrete" : "lembretes"}: ${resumo} · ${aparelhos} ${aparelhos === 1 ? "aparelho" : "aparelhos"}`}
    >
      <Botao icone={<Settings2 className="h-4 w-4" />}>Gerenciar lembretes</Botao>
    </Cartao>
  )
}

function Cartao({ fundo, claro, titulo, texto, children }: { fundo: string; claro?: boolean; titulo: string; texto: string; children: React.ReactNode }) {
  return (
    <section
      className={`mt-4 flex flex-col gap-3 rounded-[20px] border border-black p-4 sm:flex-row sm:items-center sm:justify-between ${claro ? "text-white" : ""}`}
      style={{ background: fundo }}
    >
      <div className="min-w-0">
        <p className="display text-2xl">{titulo}</p>
        <p className="text-sm font-medium">{texto}</p>
      </div>
      {children}
    </section>
  )
}

function Botao({ icone, children }: { icone: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link href="/lembretes" className="pilula pilula-fantasma shrink-0 !py-3 text-sm">
      {icone} {children}
    </Link>
  )
}
