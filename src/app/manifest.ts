import type { MetadataRoute } from "next"

// Manifesto do app instalável (PWA). No iPhone o push só funciona depois de "Adicionar à Tela de Início".
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pague Dez",
    short_name: "Pague Dez",
    description: "Registre suas flexões, bata recordes e conquiste taças.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#dceeff",
    theme_color: "#000000",
    lang: "pt-BR",
    icons: [
      { src: "/icone-pwa/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icone-pwa/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icone-pwa/512-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
