import Link from "next/link"
import { notFound } from "next/navigation"
import { Send } from "lucide-react"
import { exigirUsuarioSocial, origemDoSite } from "@/server/social"
import { AppShell } from "@/components/app-shell"
import { AbasPeriodo, periodoDaUrl, RankingLista } from "@/components/ranking-lista"
import { corCss, primeiroNome } from "@/lib/comunidade"
import { NIVEIS_VISIBILIDADE } from "@/lib/visibilidade"
import { amigosParaConvocar, obterComunidade } from "@/server/comunidades"
import { rankingDe } from "@/server/ranking"
import { AcoesMembro } from "./_components/acoes-membro"
import { ConvocarAmigos } from "./_components/convocar-amigos"
import { PainelComandante } from "./_components/painel-comandante"

export const dynamic = "force-dynamic"
export const metadata = { title: "Pelotão" }

export default async function PelotaoPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ p?: string }> }) {
  const usuario = await exigirUsuarioSocial()
  const { id } = await params
  const periodo = periodoDaUrl((await searchParams).p)

  // Só membros enxergam o pelotão
  const dados = await obterComunidade(id, usuario.id)
  if (!dados) notFound()
  const { comunidade, meuPapel, membros } = dados
  const comandante = meuPapel === "DONO"

  const [linhas, amigosDisponiveis] = await Promise.all([
    rankingDe(membros.map((m) => m.userId), periodo),
    amigosParaConvocar(usuario.id, id),
  ])
  const nivel = NIVEIS_VISIBILIDADE[comunidade.nivelVisibilidade] ?? NIVEIS_VISIBILIDADE[0]
  const linkEntrada = `${await origemDoSite()}/c/${comunidade.codigoEntrada}`
  const donoNome = membros.find((m) => m.userId === comunidade.donoId)?.name

  return (
    <AppShell usuario={usuario}>
      <Link href="/comunidades" className="rotulo underline underline-offset-4">← Pelotões</Link>

      <header className="mt-3 mb-6 rounded-[20px] border border-black p-5" style={{ background: corCss(comunidade.cor) }}>
        <h1 className="display break-words text-[40px] sm:text-[52px]">{comunidade.nome}</h1>
        {comunidade.descricao && <p className="mt-2 font-medium">{comunidade.descricao}</p>}
        <p className="rotulo mt-3 inline-block rounded-full border border-black bg-white px-3 py-1.5">
          {membros.length} {membros.length === 1 ? "soldado" : "soldados"}
          {donoNome ? ` · comandante ${primeiroNome(donoNome)}` : ""}
        </p>
      </header>

      <section>
        <h2 className="rotulo mb-3">Ranking do pelotão</h2>
        <AbasPeriodo base={`/comunidades/${id}`} atual={periodo} />
        <RankingLista linhas={linhas} euId={usuario.id} hrefDe={(uid) => `/comunidades/${id}/membro/${uid}`} />
        <p className="mt-3 text-center text-xs text-[var(--texto-3)]">
          Neste pelotão os membros veem: <strong>{nivel.titulo.toLowerCase()}</strong> (decisão do comandante).
        </p>
      </section>

      <section className="mt-8">
        <Link href={`/convidar?comunidade=${id}`} className="pilula pilula-cheia w-full !py-4 text-base">
          <Send className="h-5 w-5" /> Convidar um amigo para o pelotão
        </Link>
      </section>

      <ConvocarAmigos comunidadeId={id} amigos={amigosDisponiveis} />

      {comandante ? (
        <PainelComandante
          comunidadeId={id}
          inicial={{ nome: comunidade.nome, descricao: comunidade.descricao ?? "", cor: comunidade.cor as never, nivel: (comunidade.nivelVisibilidade as 0 | 1 | 2) ?? 0 }}
          entradaAtiva={comunidade.entradaAtiva}
          linkEntrada={linkEntrada}
          membros={membros.filter((m) => m.userId !== usuario.id).map((m) => ({ userId: m.userId, name: m.name }))}
        />
      ) : (
        <AcoesMembro comunidadeId={id} nome={comunidade.nome} />
      )}
    </AppShell>
  )
}
