import Link from "next/link"
import { exigirUsuarioSocial } from "@/server/social"
import { AppShell } from "@/components/app-shell"
import { Emblema } from "@/components/emblema"
import { listarEmblemas } from "@/server/emblemas"

export const dynamic = "force-dynamic"
export const metadata = { title: "Emblemas" }

export default async function EmblemasPage() {
  const usuario = await exigirUsuarioSocial()
  const { emblemas, stats } = await listarEmblemas(usuario.id)
  const ganhos = emblemas.filter((e) => e.conquistadoEm !== null).length

  return (
    <AppShell usuario={usuario}>
      <Link href="/tropa" className="rotulo underline underline-offset-4">← Tropa</Link>
      <h1 className="display mt-3 mb-2 text-[52px]">Emblemas</h1>
      <p className="mb-6 font-medium">
        <span className="rounded-full border border-black bg-[var(--sol)] px-2.5 py-0.5 font-bold">
          {ganhos} de {emblemas.length}
        </span>{" "}
        conquistados.
        {stats.convitesAceitos > 0 && ` Você já recrutou ${stats.convitesAceitos} ${stats.convitesAceitos === 1 ? "amigo" : "amigos"}.`}
      </p>

      <ul className="grid gap-4 sm:grid-cols-2">
        {/* Conquistados primeiro; os bloqueados mostram como ganhar */}
        {[...emblemas]
          .sort((a, b) => Number(b.conquistadoEm !== null) - Number(a.conquistadoEm !== null))
          .map((e) => (
            <Emblema key={e.tipo} {...e} />
          ))}
      </ul>
    </AppShell>
  )
}
