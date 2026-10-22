import { readFile } from "node:fs/promises"
import path from "node:path"
import { ImageResponse } from "next/og"
import type { TemaNotificacao } from "@/lib/lembretes"

// Imagens da notificação push, no mesmo estilo "adesivos" do app: contorno preto, sem gradiente nem sombra.

const fonte = () => readFile(path.join(process.cwd(), "src/assets/BowlbyOne-Regular.ttf"))

const TEMAS: Record<TemaNotificacao, { lavado: string; marca: string }> = {
  azul: { lavado: "#dceeff", marca: "#4da2ff" },
  rosa: { lavado: "#ffe3f1", marca: "#ff6fb5" },
}

/**
 * Selo pequeno da barra de status do Android. O sistema usa só a transparência da imagem (pinta tudo de branco),
 * então ele é um anel com o "10" vazado em cima de fundo transparente — um círculo cheio viraria uma bolinha branca.
 */
export async function badgeNotificacao() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent" }}>
        <div
          style={{
            width: 96,
            height: 96,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "10px solid #000000",
            borderRadius: "50%",
            color: "#000000",
            fontFamily: "Bowlby One",
            fontSize: 42,
            paddingTop: 4,
          }}
        >
          10
        </div>
      </div>
    ),
    { width: 96, height: 96, fonts: [{ name: "Bowlby One", data: await fonte(), weight: 400, style: "normal" }] }
  )
}

/** Imagem grande que aparece sob o texto da notificação (2:1). Mantém o conteúdo longe das bordas, que alguns sistemas cortam. */
export async function bannerNotificacao(tema: TemaNotificacao) {
  const cor = TEMAS[tema]

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: cor.lavado, fontFamily: "Bowlby One", color: "#000000" }}>
        <div style={{ position: "absolute", left: 72, top: 104, display: "flex", flexDirection: "column", fontSize: 154, lineHeight: 0.95 }}>
          <span>PAGUE</span>
          <span>DEZ!</span>
        </div>

        <div
          style={{
            position: "absolute",
            right: 64,
            top: 48,
            width: 204,
            height: 204,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffd731",
            border: "8px solid #000000",
            borderRadius: "50%",
            fontSize: 96,
            paddingTop: 10,
            transform: "rotate(10deg)",
          }}
        >
          10
        </div>

        <div
          style={{
            position: "absolute",
            right: 48,
            bottom: 76,
            display: "flex",
            padding: "12px 40px 8px",
            background: "#55db9c",
            border: "6px solid #000000",
            borderRadius: 999,
            fontSize: 52,
            transform: "rotate(-6deg)",
          }}
        >
          SELVA!
        </div>

        <div
          style={{
            position: "absolute",
            right: 366,
            bottom: 52,
            width: 84,
            height: 84,
            display: "flex",
            background: "#fb4903",
            border: "6px solid #000000",
            borderRadius: 22,
            transform: "rotate(16deg)",
          }}
        />

        <div
          style={{
            position: "absolute",
            right: 330,
            top: 300,
            width: 64,
            height: 64,
            display: "flex",
            background: cor.marca,
            border: "6px solid #000000",
            borderRadius: "50%",
          }}
        />
      </div>
    ),
    { width: 1024, height: 512, fonts: [{ name: "Bowlby One", data: await fonte(), weight: 400, style: "normal" }] }
  )
}
