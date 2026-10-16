import Link from "next/link"
import { redirect } from "next/navigation"
import { usuarioAtual } from "@/lib/auth"
import { CartaoAcesso } from "@/components/cartao-acesso"
import { corCss } from "@/lib/comunidade"
import { tokenSchema } from "@/lib/validators"
import { consultarPorCodigo, ehMembro } from "@/server/comunidades"
import { exigirSocial } from "@/server/social"
import { EntrarComunidade } from "./_components/entrar-comunidade"

export const dynamic = "force-dynamic"
export const metadata = { title: "Entrar no pelotão", robots: { index: false, follow: false } }

const BOTAO = "pilula pilula-cheia w-full !py-4 text-base"
const BOTAO_FANTASMA = "pilula pilula-fantasma w-full !py-4 text-base"

export default async function EntradaPage({ params }: { params: Promise<{ codigo: string }> }) {
  exigirSocial()
  const { codigo } = await params
  const valido = tokenSchema.safeParse(codigo)
  const pelotao = valido.success ? await consultarPorCodigo(valido.data) : null
  const usuario = await usuarioAtual()

  if (!pelotao) {
    return (
      <CartaoAcesso subtitulo="Este link de pelotão não existe.">
        <Link href={usuario ? "/" : "/cadastro"} className={BOTAO}>{usuario ? "Ir para o app" : "Criar minha conta"}</Link>
      </CartaoAcesso>
    )
  }

  if (usuario && (await ehMembro(usuario.id, pelotao.id))) redirect(`/comunidades/${pelotao.id}`)

  const proximo = `/c/${codigo}`
  const cartao = (
    <div className="mb-5 rounded-[20px] border border-black p-4 text-center" style={{ background: corCss(pelotao.cor) }}>
      <p className="display text-3xl">{pelotao.nome}</p>
      {pelotao.descricao && <p className="mt-2 text-sm font-medium">{pelotao.descricao}</p>}
      <p className="rotulo mt-3 inline-block rounded-full border border-black bg-white px-3 py-1">
        Comandante {pelotao.donoNome} · {pelotao.membros} {pelotao.membros === 1 ? "soldado" : "soldados"}
      </p>
    </div>
  )

  if (!pelotao.entradaAtiva) {
    return (
      <CartaoAcesso subtitulo="A entrada neste pelotão está fechada no momento.">
        {cartao}
        <p className="text-center text-sm font-medium">Peça um convite direto ao comandante {pelotao.donoNome}.</p>
      </CartaoAcesso>
    )
  }

  return (
    <CartaoAcesso subtitulo={`${pelotao.donoNome} chamou você para o pelotão!`}>
      {cartao}
      {usuario ? (
        <EntrarComunidade codigo={codigo} nome={pelotao.nome} />
      ) : (
        <div className="space-y-3">
          <Link href={`/cadastro?next=${encodeURIComponent(proximo)}`} className={BOTAO}>Criar conta e entrar</Link>
          <Link href={`/login?next=${encodeURIComponent(proximo)}`} className={BOTAO_FANTASMA}>Já sou da tropa</Link>
        </div>
      )}
    </CartaoAcesso>
  )
}
