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

export async function registrarServiceWorker(): Promise<ServiceWorkerRegistration> {
  await navigator.serviceWorker.register("/sw.js", { scope: "/" })
  return navigator.serviceWorker.ready
}

export async function inscricaoAtual(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator)) return null
  const registro = await navigator.serviceWorker.getRegistration("/")
  return registro ? registro.pushManager.getSubscription() : null
}

/** Pede permissão (precisa estar dentro de um clique) e cria a inscrição de push deste aparelho. */
export async function inscreverNoPush(chavePublica: string): Promise<{ ok: true; inscricao: PushSubscription } | { ok: false; motivo: "negada" | "falhou" }> {
  const permissao = await Notification.requestPermission()
  if (permissao !== "granted") return { ok: false, motivo: "negada" }
  try {
    const registro = await registrarServiceWorker()
    const existente = await registro.pushManager.getSubscription()
    const inscricao =
      existente ?? (await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chaveParaUint8Array(chavePublica) }))
    return { ok: true, inscricao }
  } catch (erro) {
    console.error("Falha ao criar a inscrição de push:", erro)
    return { ok: false, motivo: "falhou" }
  }
}

export async function cancelarInscricao(): Promise<string | null> {
  const atual = await inscricaoAtual()
  if (!atual) return null
  const endpoint = atual.endpoint
  await atual.unsubscribe()
  return endpoint
}
