import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { exigirUsuarioSocial } from "@/server/social"
import { AppShell } from "@/components/app-shell"
import { corCss } from "@/lib/comunidade"
import { listarMinhasComunidades } from "@/server/comunidades"
import { NovaComunidade } from "./_components/nova-comunidade"

export const dynamic = "force-dynamic"
export const metadata = { title: "Pelotões" }

export default async function ComunidadesPage() {
  const usuario = await exigirUsuarioSocial()
  const pelotoes = await listarMinhasComunidades(usuario.id)

  return (
    <AppShell usuario={usuario}>
      <Link href="/tropa" className="rotulo underline underline-offset-4">← Tropa</Link>
      <h1 className="display mt-3 mb-2 text-[48px] sm:text-[52px]">Pelotões</h1>
      <p className="mb-6 font-medium">Comunidades de Pagação: monte o seu pelotão e veja quem lidera o ranking.</p>

      <NovaComunidade />

      <section className="mt-8">
        <h2 className="rotulo mb-3">Meus pelotões ({pelotoes.length})</h2>
        {pelotoes.length === 0 ? (
          <p className="adesivo p-5 text-center font-bold">Você ainda não está em nenhum pelotão.</p>
        ) : (
          <ul className="space-y-3">
            {pelotoes.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/comunidades/${p.id}`}
                  className="flex items-center gap-3 rounded-[20px] border border-black p-4 transition hover:brightness-95"
                  style={{ background: corCss(p.cor) }}
                >
                  <span className="min-w-0 flex-1">
                    <span className="display block truncate text-2xl">{p.nome}</span>
                    <span className="text-sm font-bold">
                      {p.membros} {p.membros === 1 ? "soldado" : "soldados"} · {p.meuPapel === "DONO" ? "você é o comandante" : "membro"}
                    </span>
                  </span>
                  <ChevronRight className="h-6 w-6 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  )
}
