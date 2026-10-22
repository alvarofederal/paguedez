// Service worker do Pague Dez — recebe as notificações push (lembretes) mesmo com o app fechado.
// Não guarda nada em cache: serve só para push e para abrir o app ao tocar na notificação.

self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()))

self.addEventListener("push", (event) => {
  let dados = {}
  try {
    dados = event.data ? event.data.json() : {}
  } catch {
    dados = { corpo: event.data ? event.data.text() : "" }
  }

  // Todo push precisa mostrar uma notificação (exigência do navegador, principalmente no iPhone)
  event.waitUntil(
    self.registration.showNotification(dados.titulo || "Pague Dez", {
      body: dados.corpo || "Hora de pagar suas flecas.",
      icon: "/icone-pwa/192",
      badge: "/icone-pwa/192",
      tag: dados.tag || "pague-dez", // mesma tag = a notificação nova substitui a anterior, sem empilhar
      renotify: true,
      data: { url: dados.url || "/" },
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const destino = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((janelas) => {
      // Se o app já está aberto, usa a mesma janela em vez de abrir outra
      for (const janela of janelas) {
        if (new URL(janela.url).origin === self.location.origin && "focus" in janela) {
          if ("navigate" in janela) janela.navigate(destino)
          return janela.focus()
        }
      }
      return self.clients.openWindow(destino)
    })
  )
})
