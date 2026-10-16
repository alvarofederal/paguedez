import Link from "next/link"
import { redirect } from "next/navigation"
import { usuarioAtual } from "@/lib/auth"
import { CartaoAcesso } from "@/components/cartao-acesso"
import { tokenSchema } from "@/lib/validators"
import { consultarConvite } from "@/server/convites"
import { exigirSocial } from "@/server/social"
import { AceitarConvite } from "./_components/aceitar-convite"

export const dynamic = "force-dynamic"
export const metadata = { title: "Convite", robots: { index: false, follow: false } }

const BOTAO = "pilula pilula-cheia w-full !py-4 text-base"
const BOTAO_FANTASMA = "pilula pilula-fantasma w-full !py-4 text-base"

export default async function ConvitePage({ params }: { params: Promise<{ token: string }> }) {
  exigirSocial()
  const { token } = await params
  const valido = tokenSchema.safeParse(token)
  const convite = valido.success ? await consultarConvite(valido.data) : null
  const usuario = await usuarioAtual()

  if (!convite) {
    return (
      <CartaoAcesso subtitulo="Esse convite não existe ou o link está incompleto.">
        <Link href={usuario ? "/" : "/cadastro"} className={BOTAO}>
          {usuario ? "Ir para o app" : "Criar minha conta mesmo assim"}
        </Link>
      </CartaoAcesso>
    )
  }

  // Quem já aceitou e abre o link de novo só segue em frente
  if (usuario && convite.status === "ACEITO" && convite.aceitoPorId === usuario.id) redirect(convite.pelotao ? "/comunidades" : "/tropa")

  if (convite.status !== "PENDENTE") {
    return (
      <CartaoAcesso subtitulo={convite.status === "ACEITO" ? "Este convite já foi usado." : "Este convite expirou ou foi cancelado."}>
        <p className="mb-4 text-center text-sm font-medium">Peça um link novo a {convite.convidanteNome} — ou crie a sua conta agora.</p>
        <Link href={usuario ? "/" : "/cadastro"} className={BOTAO}>
          {usuario ? "Ir para o app" : "Criar minha conta"}
        </Link>
      </CartaoAcesso>
    )
  }

  const proximo = `/convite/${token}`
  const titulo = convite.pelotao
    ? `${convite.convidanteNome} convocou você para o pelotão "${convite.pelotao.nome}"!`
    : `${convite.convidanteNome} mandou você pagar dez!`

  if (usuario) {
    if (usuario.id === convite.convidanteId) {
      return (
        <CartaoAcesso subtitulo="Este é o seu próprio convite.">
          <p className="mb-4 text-center text-sm font-medium">Mande o link para o seu amigo — ele é quem deve abrir.</p>
          <Link href="/convidar" className={BOTAO}>Voltar aos convites</Link>
        </CartaoAcesso>
      )
    }
    return (
      <CartaoAcesso subtitulo={titulo}>
        <AceitarConvite token={token} convidanteNome={convite.convidanteNome} pelotao={convite.pelotao?.nome ?? null} />
      </CartaoAcesso>
    )
  }

  return (
    <CartaoAcesso subtitulo={titulo}>
      <p className="mb-5 text-center text-sm font-medium">
        Pague Dez é o app de flexões da tropa: registre suas flecas, bata recordes e ganhe taças. Crie sua conta em um minuto.
      </p>
      <div className="space-y-3">
        <Link href={`/cadastro?next=${encodeURIComponent(proximo)}`} className={BOTAO}>Criar conta e pagar</Link>
        <Link href={`/login?next=${encodeURIComponent(proximo)}`} className={BOTAO_FANTASMA}>Já sou da tropa</Link>
      </div>
    </CartaoAcesso>
  )
}
