import Link from "next/link"
import { Award, Send, Users } from "lucide-react"
import { exigirUsuarioSocial } from "@/server/social"
import { AppShell } from "@/components/app-shell"
import { AbasPeriodo, periodoDaUrl, RankingLista } from "@/components/ranking-lista"
import { listarAmigos } from "@/server/amizades"
import { rankingDe } from "@/server/ranking"
import { AmigoConfig } from "./_components/amigo-config"

export const dynamic = "force-dynamic"
export const metadata = { title: "Tropa" }

const ATALHOS = [
  { href: "/convidar", titulo: "Mandar pagar dez", texto: "Chame um amigo pelo WhatsApp", icone: Send, cor: "var(--menta)" },
  { href: "/comunidades", titulo: "Pelotões", texto: "Comunidades de Pagação", icone: Users, cor: "var(--lavanda)" },
  { href: "/emblemas", titulo: "Emblemas", texto: "Suas conquistas", icone: Award, cor: "var(--sol)" },
]

export default async function TropaPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const usuario = await exigirUsuarioSocial()
  const periodo = periodoDaUrl((await searchParams).p)

  const amigos = await listarAmigos(usuario.id)
  const linhas = await rankingDe([usuario.id, ...amigos.map((a) => a.userId)], periodo)

  return (
    <AppShell usuario={usuario}>
      <h1 className="display mt-2 mb-5 text-[52px]">Tropa</h1>

      <ul className="grid gap-3 sm:grid-cols-3">
        {ATALHOS.map(({ href, titulo, texto, icone: Icone, cor }) => (
          <li key={href}>
            <Link href={href} className="flex items-center gap-3 rounded-[20px] border border-black p-4 transition hover:brightness-95 sm:flex-col sm:items-start" style={{ background: cor }}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black bg-white">
                <Icone className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-bold leading-tight">{titulo}</span>
                <span className="text-sm">{texto}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-8">
        <h2 className="rotulo mb-3">Ranking dos amigos</h2>
        <AbasPeriodo base="/tropa" atual={periodo} />
        {amigos.length === 0 ? (
          <div className="adesivo p-6 text-center">
            <p className="font-bold">Você ainda não tem amigos na tropa.</p>
            <p className="mt-1 mb-4 text-sm">Mande um amigo pagar dez — quando ele aceitar, o ranking aparece aqui.</p>
            <Link href="/convidar" className="pilula pilula-cheia">Mandar pagar dez</Link>
          </div>
        ) : (
          <RankingLista linhas={linhas} euId={usuario.id} hrefDe={(id) => `/tropa/${id}`} />
        )}
      </section>

      {amigos.length > 0 && (
        <section className="mt-10">
          <h2 className="rotulo mb-1">Quem vê o quê</h2>
          <p className="mb-3 text-sm font-medium">Você decide o que cada amigo enxerga das suas atividades.</p>
          <ul className="space-y-3">
            {amigos.map((a) => (
              <AmigoConfig key={a.userId} amigoId={a.userId} nome={a.name} euMostro={a.euMostro} elesMostram={a.elesMostram} />
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  )
}
