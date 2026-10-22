import { seloIcone } from "@/components/selo-icone"

// Ícones do app instalável e da notificação: /icone-pwa/192, /icone-pwa/512 e /icone-pwa/512-maskable
const TAMANHOS: Record<string, { px: number; fundo?: string }> = {
  "192": { px: 192 },
  "512": { px: 512 },
  // "maskable": o sistema recorta o ícone (círculo, quadrado arredondado...), então ele precisa de fundo e margem
  "512-maskable": { px: 512, fundo: "#dceeff" },
}

export async function GET(_req: Request, { params }: { params: Promise<{ tamanho: string }> }) {
  const alvo = TAMANHOS[(await params).tamanho]
  if (!alvo) return new Response("Tamanho inválido", { status: 404 })

  const resposta = await seloIcone(alvo.px, alvo.fundo)
  resposta.headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400")
  return resposta
}
