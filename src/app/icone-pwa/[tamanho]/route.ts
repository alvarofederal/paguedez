import { seloIcone } from "@/components/selo-icone"
import { badgeNotificacao, bannerNotificacao } from "@/components/imagens-notificacao"

// Imagens do app instalável e da notificação push:
//   /icone-pwa/192, /icone-pwa/512, /icone-pwa/512-maskable  → ícones
//   /icone-pwa/badge                                         → selo monocromático da barra de status do Android
//   /icone-pwa/banner-azul, /icone-pwa/banner-rosa           → imagem grande da notificação
const TAMANHOS: Record<string, { px: number; fundo?: string }> = {
  "192": { px: 192 },
  "512": { px: 512 },
  // "maskable": o sistema recorta o ícone (círculo, quadrado arredondado...), então ele precisa de fundo e margem
  "512-maskable": { px: 512, fundo: "#dceeff" },
}

export async function GET(_req: Request, { params }: { params: Promise<{ tamanho: string }> }) {
  const nome = (await params).tamanho

  let resposta: Response
  if (nome === "badge") resposta = await badgeNotificacao()
  else if (nome === "banner-azul") resposta = await bannerNotificacao("azul")
  else if (nome === "banner-rosa") resposta = await bannerNotificacao("rosa")
  else {
    const alvo = TAMANHOS[nome]
    if (!alvo) return new Response("Tamanho inválido", { status: 404 })
    resposta = await seloIcone(alvo.px, alvo.fundo)
  }

  resposta.headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400")
  return resposta
}
