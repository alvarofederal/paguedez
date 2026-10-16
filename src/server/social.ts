import "server-only"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { usuarioAtual } from "@/lib/auth"
import { socialAtivo } from "@/lib/social-flag"

/** Páginas sociais respondem 404 quando FEATURE_SOCIAL=false. */
export function exigirSocial() {
  if (!socialAtivo()) notFound()
}

/** Endereço do próprio app, para montar links de convite (Vercel agora, domínio próprio depois — sem configurar nada). */
export async function origemDoSite(): Promise<string> {
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
  const local = host.startsWith("localhost") || host.startsWith("127.")
  const proto = h.get("x-forwarded-proto") ?? (local ? "http" : "https")
  return `${proto}://${host}`
}

/** Entrada padrão das páginas sociais privadas: recurso ligado + usuário logado e ativo. */
export async function exigirUsuarioSocial() {
  exigirSocial()
  const usuario = await usuarioAtual()
  if (!usuario) redirect("/login")
  return usuario
}
