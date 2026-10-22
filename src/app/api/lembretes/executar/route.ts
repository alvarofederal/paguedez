import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { executarLembretes } from "@/server/lembretes"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * Endpoint do agendador. Quem chama (Vercel Cron ou um agendador externo gratuito como o cron-job.org) envia
 *   Authorization: Bearer <CRON_SECRET>
 * A Vercel manda esse cabeçalho sozinha quando a variável CRON_SECRET existe no projeto.
 */
function autorizado(req: Request): boolean {
  const segredo = process.env.CRON_SECRET
  if (!segredo) return false // sem segredo configurado, o endpoint fica fechado
  const enviado = req.headers.get("authorization") ?? ""
  const esperado = `Bearer ${segredo}`
  const a = Buffer.from(enviado)
  const b = Buffer.from(esperado)
  return a.length === b.length && timingSafeEqual(a, b)
}

async function tratar(req: Request) {
  if (!autorizado(req)) return NextResponse.json({ erro: "não autorizado" }, { status: 401 })
  try {
    return NextResponse.json({ ok: true, ...(await executarLembretes()) })
  } catch (erro) {
    console.error("Falha ao executar lembretes:", erro)
    return NextResponse.json({ ok: false, erro: "falha ao executar" }, { status: 500 })
  }
}

export const GET = tratar
export const POST = tratar
