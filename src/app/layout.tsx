import type { Metadata, Viewport } from "next"
import { Bowlby_One, Inter } from "next/font/google"
import { Toaster } from "sonner"
import { usuarioAtual } from "@/lib/auth"
import "./globals.css"

// Substitutos livres do par Lateral (display) + Aeonik Pro (UI) da referência visual
const fonteDisplay = Bowlby_One({ variable: "--fonte-display", subsets: ["latin"], weight: "400" })
const fonteUi = Inter({ variable: "--fonte-ui", subsets: ["latin"], weight: ["500", "700"] })

export const metadata: Metadata = {
  title: {
    default: "Pague Dez",
    template: "%s | Pague Dez",
  },
  description: "Pague suas flecas todo dia, bata recordes e conquiste taças. Pague dez!",
  applicationName: "Pague Dez",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Pague Dez",
    title: "Pague Dez — pague suas flecas!",
    description: "Registre suas flexões, bata recordes e conquiste taças.",
  },
}

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const usuario = await usuarioAtual()

  return (
    <html lang="pt-BR" data-sexo={usuario?.sexo ?? "MASCULINO"}>
      <body className={`${fonteDisplay.variable} ${fonteUi.variable} antialiased`}>
        {children}
        <Toaster
          position="top-center"
          duration={2500}
          toastOptions={{
            style: {
              background: "#ffffff",
              color: "#000000",
              border: "1px solid #000000",
              borderRadius: "1600px",
              boxShadow: "none",
              fontWeight: 700,
            },
          }}
        />
      </body>
    </html>
  )
}
