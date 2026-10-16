import Link from "next/link"
import { notFound } from "next/navigation"
import { exigirUsuarioSocial } from "@/server/social"
import { AppShell } from "@/components/app-shell"
import { PerfilVisivel } from "@/components/perfil-visivel"
import { primeiroNome } from "@/lib/comunidade"
import { obterComunidade } from "@/server/comunidades"

export const dynamic = "force-dynamic"
export const metadata = { title: "Membro do pelotão" }

export default async function MembroPage({ params }: { params: Promise<{ id: string; userId: string }> }) {
  const usuario = await exigirUsuarioSocial()
  const { id, userId } = await params

  // Os dois precisam ser membros do pelotão; o nível é o que o COMANDANTE definiu para o pelotão todo
  const dados = await obterComunidade(id, usuario.id)
  const membro = dados?.membros.find((m) => m.userId === userId)
  if (!dados || !membro) notFound()

  const dono = dados.membros.find((m) => m.userId === dados.comunidade.donoId)

  return (
    <AppShell usuario={usuario}>
      <Link href={`/comunidades/${id}`} className="rotulo underline underline-offset-4">← {dados.comunidade.nome}</Link>
      <h1 className="display mt-3 mb-6 break-words text-[44px] sm:text-[52px]">{primeiroNome(membro.name)}</h1>
      <PerfilVisivel
        userId={membro.userId}
        nome={primeiroNome(membro.name)}
        nivel={dados.comunidade.nivelVisibilidade}
        quemDecide={dono ? `O comandante ${primeiroNome(dono.name)}` : "O comandante"}
      />
    </AppShell>
  )
}
