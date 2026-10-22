import "server-only"
import { createHash } from "node:crypto"
import webpush from "web-push"
import prisma from "@/lib/prisma"
import type { PayloadPush } from "@/lib/lembretes"

// Web Push padrão (VAPID): os próprios navegadores entregam, sem Firebase, sem conta externa e sem custo por mensagem.

export type InscricaoJson = { endpoint: string; keys: { p256dh: string; auth: string } }
export type Entrega = { enviadas: number; removidas: number; falhas: number }

export function pushConfigurado(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
}

/** Chave pública (a que o navegador precisa para se inscrever). Lida em tempo de execução, sem exigir rebuild. */
export function chavePublicaVapid(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null
}

let configurado = false
function configurar() {
  if (configurado) return
  const pub = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) throw new Error("VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY não configuradas")
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:alvarofederal@gmail.com", pub, priv)
  configurado = true
}

const hashDoEndpoint = (endpoint: string) => createHash("sha256").update(endpoint).digest("hex")

/** Guarda o aparelho. O mesmo aparelho logando em outra conta passa a pertencer à conta atual (evita avisos para a pessoa errada). */
export async function salvarInscricao(userId: string, sub: InscricaoJson, agente?: string) {
  const endpointHash = hashDoEndpoint(sub.endpoint)
  const dados = { userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, agente: agente?.slice(0, 160) ?? null }
  await prisma.pushInscricao.upsert({ where: { endpointHash }, update: dados, create: { endpointHash, ...dados } })
}

export async function removerInscricao(userId: string, endpoint: string) {
  await prisma.pushInscricao.deleteMany({ where: { endpointHash: hashDoEndpoint(endpoint), userId } })
}

export function contarInscricoes(userId: string) {
  return prisma.pushInscricao.count({ where: { userId } })
}

/** Envia para todos os aparelhos do usuário. Inscrições que o serviço de push diz que não existem mais (404/410) são apagadas. */
export async function enviarPush(userId: string, payload: PayloadPush): Promise<Entrega> {
  configurar()
  const inscricoes = await prisma.pushInscricao.findMany({ where: { userId } })
  const resultado: Entrega = { enviadas: 0, removidas: 0, falhas: 0 }

  await Promise.all(
    inscricoes.map(async (i) => {
      try {
        await webpush.sendNotification(
          { endpoint: i.endpoint, keys: { p256dh: i.p256dh, auth: i.auth } },
          JSON.stringify(payload),
          // TTL de 1h: se o aparelho estiver desligado por mais que isso, o lembrete já perdeu o sentido
          { TTL: 60 * 60, urgency: "normal" }
        )
        resultado.enviadas++
      } catch (erro) {
        const status = (erro as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          await prisma.pushInscricao.delete({ where: { id: i.id } }).catch(() => undefined)
          resultado.removidas++
        } else {
          resultado.falhas++
          console.error("Falha ao enviar push:", status, (erro as Error).message)
        }
      }
    })
  )
  return resultado
}
