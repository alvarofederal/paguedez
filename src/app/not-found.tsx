import Link from "next/link"
import { CartaoAcesso } from "@/components/cartao-acesso"

export const metadata = { title: "Página não encontrada" }

export default function NaoEncontrada() {
  return (
    <CartaoAcesso subtitulo="Essa página não existe — ou você não tem acesso a ela.">
      <Link href="/" className="pilula pilula-cheia w-full !py-4 text-base">
        Voltar ao início
      </Link>
    </CartaoAcesso>
  )
}
