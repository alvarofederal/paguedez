import Link from "next/link"
import { notFound } from "next/navigation"
import { exigirUsuarioSocial } from "@/server/social"
import { AppShell } from "@/components/app-shell"
import { PerfilVisivel } from "@/components/perfil-visivel"
import { primeiroNome } from "@/lib/comunidade"
import { listarAmigos } from "@/server/amizades"

export const dynamic = "force-dynamic"
export const metadata = { title: "Amigo" }

export default async function AmigoPage({ params }: { params: Promise<{ userId: string }> }) {
  const usuario = await exigirUsuarioSocial()
  const { userId } = await params

  // Só amigos conectados: para qualquer outra pessoa a página "não existe"
  const amigo = (await listarAmigos(usuario.id)).find((a) => a.userId === userId)
  if (!amigo) notFound()

  return (
    <AppShell usuario={usuario}>
      <Link href="/tropa" className="rotulo underline underline-offset-4">← Tropa</Link>
      <h1 className="display mt-3 mb-6 break-words text-[44px] sm:text-[52px]">{primeiroNome(amigo.name)}</h1>
      <PerfilVisivel userId={amigo.userId} nome={primeiroNome(amigo.name)} nivel={amigo.elesMostram} quemDecide={primeiroNome(amigo.name)} />
    </AppShell>
  )
}
