// Funções do NAVEGADOR para o push (use só em componentes "use client", dentro de efeitos ou cliques).

export type SuporteApp = "ok" | "instalar-no-iphone" | "nao-suportado"

export function ehIOS(): boolean {
  const ua = navigator.userAgent
  // iPadOS recente se apresenta como "Mac" com tela de toque
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1)
}

export function instaladoComoApp(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

export function verificarSuporte(): SuporteApp {
  const basico = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
  // No iPhone o push só existe quando o site foi adicionado à Tela de Início
  if (ehIOS() && !instaladoComoApp()) return "instalar-no-iphone"
  return basico ? "ok" : "nao-suportado"
}

export function chaveParaUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const preenchimento = "=".repeat((4 - (base64Url.length % 4)) % 4)
  const base64 = (base64Url + preenchimento).replace(/-/g, "+").replace(/_/g, "/")
  const bruto = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(bruto.length))
  for (let i = 0; i < bruto.length; i++) bytes[i] = bruto.charCodeAt(i)
  return bytes
}

function comTempoLimite<T>(promessa: Promise<T>, ms: number, mensagem: string): Promise<T> {
  return Promise.race([promessa, new Promise<never>((_, rejeitar) => setTimeout(() => rejeitar(new Error(mensagem)), ms))])
}

export async function registrarServiceWorker(): Promise<ServiceWorkerRegistration> {
  await navigator.serviceWorker.register("/sw.js", { scope: "/" })
  return comTempoLimite(navigator.serviceWorker.ready, 10_000, "O service worker não ficou ativo em 10 segundos")
}

/** Nome curto do navegador, só para o relatório de erro. */
export function nomeDoNavegador(): string {
  const ua = navigator.userAgent
  if ((navigator as Navigator & { brave?: unknown }).brave) return "Brave"
  if (ua.includes("Edg/")) return "Edge"
  if (ua.includes("OPR/")) return "Opera"
  if (ua.includes("Firefox/")) return "Firefox"
  if (ua.includes("SamsungBrowser")) return "Samsung Internet"
  if (ua.includes("Chrome/")) return "Chrome"
  if (ua.includes("Safari/")) return "Safari"
  return "navegador desconhecido"
}

export type FalhaInscricao = { ok: false; motivo: "negada" | "falhou"; etapa?: string; detalhe?: string }

export async function inscricaoAtual(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator)) return null
  const registro = await navigator.serviceWorker.getRegistration("/")
  return registro ? registro.pushManager.getSubscription() : null
}

/** Pede permissão (precisa estar dentro de um clique) e cria a inscrição de push deste aparelho. */
export async function inscreverNoPush(chavePublica: string): Promise<{ ok: true; inscricao: PushSubscription } | FalhaInscricao> {
  let etapa = "pedir permissão"
  try {
    const permissao = await Notification.requestPermission()
    if (permissao !== "granted") return { ok: false, motivo: "negada", etapa, detalhe: `resposta do navegador: ${permissao}` }

    etapa = "registrar o service worker"
    const registro = await registrarServiceWorker()

    etapa = "criar a inscrição no serviço de push do navegador"
    const existente = await registro.pushManager.getSubscription()
    const inscricao =
      existente ?? (await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chaveParaUint8Array(chavePublica) }))
    return { ok: true, inscricao }
  } catch (erro) {
    console.error(`Falha ao ativar o push (etapa: ${etapa}):`, erro)
    const e = erro as Error
    return { ok: false, motivo: "falhou", etapa, detalhe: `${e?.name ?? "Erro"}: ${e?.message ?? String(erro)}` }
  }
}

export async function cancelarInscricao(): Promise<string | null> {
  const atual = await inscricaoAtual()
  if (!atual) return null
  const endpoint = atual.endpoint
  await atual.unsubscribe()
  return endpoint
}
