import Link from "next/link"
import { Bell, Send, Swords } from "lucide-react"
import { usuarioAtual } from "@/lib/auth"
import { socialAtivo } from "@/lib/social-flag"
import { painelDoDia } from "@/server/flexoes"
import { listarMinhasComunidades } from "@/server/comunidades"
import { sincronizarPatente } from "@/server/patentes"
import { contarLembretesAtivos } from "@/server/lembretes"
import { PatenteCard } from "@/components/patente-card"
import { PromocaoPatente } from "@/components/promocao-patente"
import { AppShell } from "@/components/app-shell"
import { Taca } from "@/components/taca"
import { PlacarPeriodos } from "@/components/placar-periodos"
import { SeriesHoje } from "@/components/series-hoje"
import { categoriaTaca, NOME_TIPO_TACA } from "@/lib/tacas"
import { Landing } from "./_components/landing"
import { PagarForm } from "./_components/pagar-form"

export const dynamic = "force-dynamic"

export default async function InicioPage() {
  const usuario = await usuarioAtual()
  if (!usuario) return <Landing /> // visitante: landing page pública

  const social = socialAtivo()
  const [{ resumo, seriesHoje, ultimaTaca }, pelotoes, patente, lembretesAtivos] = await Promise.all([
    painelDoDia(usuario.id),
    social ? listarMinhasComunidades(usuario.id) : Promise.resolve([]),
    // A patente é um extra: se falhar, a tela principal continua funcionando normalmente
    sincronizarPatente(usuario.id).catch((erro) => {
      console.error("Falha ao sincronizar a patente:", erro)
      return null
    }),
    // Também é um extra: se falhar, o card simplesmente não aparece
    contarLembretesAtivos(usuario.id).catch(() => null),
  ])
  // Comemora só a maior patente conquistada AGORA (Recruta, a inicial, não tem festa)
  const promovido = patente?.novas.filter((p) => p.patente !== "RECRUTA").at(-1)

  return (
    <AppShell usuario={usuario}>
      <section className="pt-4 pb-10">
        <PagarForm />
      </section>

      <PlacarPeriodos resumo={resumo} />

      {patente && <PatenteCard atual={patente.atual} progresso={patente.progresso} />}

      {lembretesAtivos === 0 && (
        <section className="mt-4 flex flex-col gap-3 rounded-[20px] border border-black bg-[var(--menta)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="display text-2xl">Lembrete diário</p>
            <p className="text-sm font-medium">Receba uma notificação na hora de pagar suas flecas, mesmo com o app fechado.</p>
          </div>
          <Link href="/lembretes" className="pilula pilula-cheia shrink-0">
            <Bell className="h-4 w-4" /> Ativar lembrete
          </Link>
        </section>
      )}
      {promovido && <PromocaoPatente patente={promovido.patente} titulo={promovido.titulo} lema={promovido.lema} />}

      {socialAtivo() && (
        <section className="mt-4 flex flex-col gap-3 rounded-[20px] border border-black bg-[var(--violeta)] p-4 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="display text-2xl">Chame a tropa!</p>
            <p className="text-sm font-medium">Mande um amigo pagar dez pelo WhatsApp e veja quem lidera o ranking.</p>
          </div>
          <Link href="/convidar" className="pilula pilula-fantasma shrink-0">
            <Send className="h-4 w-4" /> Mandar pagar dez
          </Link>
        </section>
      )}

      {social && pelotoes.length > 0 && (
        <section className="mt-3 flex flex-col gap-3 rounded-[20px] border border-black bg-[var(--sol)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="display text-2xl">Chamar o Pelotão!</p>
            <p className="text-sm font-medium">
              {pelotoes.length === 1
                ? `Convide a galera para o ${pelotoes[0].nome} ou chame quem já está na tropa.`
                : "Escolha um dos seus pelotões e chame a galera."}
            </p>
          </div>
          <Link href={pelotoes.length === 1 ? `/comunidades/${pelotoes[0].id}` : "/comunidades"} className="pilula pilula-cheia shrink-0">
            <Swords className="h-4 w-4" /> Chamar
          </Link>
        </section>
      )}

      {ultimaTaca && (
        <section className="mt-4 flex items-center gap-4 rounded-[20px] border border-black bg-[var(--lavanda)] p-4">
          <Taca nivel={ultimaTaca.nivel} tipo={ultimaTaca.tipo} tamanho={64} crescer={false} />
          <div>
            <p className="rotulo">Última taça</p>
            <p className="mt-1 text-lg font-bold leading-tight">
              {NOME_TIPO_TACA[ultimaTaca.tipo]} · {categoriaTaca(ultimaTaca.nivel, ultimaTaca.tipo).nome}
            </p>
            <p className="text-sm">{ultimaTaca.valor} flecas</p>
          </div>
        </section>
      )}

      <SeriesHoje series={seriesHoje} />

      {lembretesAtivos !== null && lembretesAtivos > 0 && (
        <p className="mt-4 text-center text-sm">
          <Bell className="mr-1 inline h-3.5 w-3.5" />
          {lembretesAtivos} {lembretesAtivos === 1 ? "lembrete ativo" : "lembretes ativos"} ·{" "}
          <Link href="/lembretes" className="font-bold underline underline-offset-4">
            gerenciar
          </Link>
        </p>
      )}
    </AppShell>
  )
}
