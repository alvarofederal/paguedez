import { readFile } from "node:fs/promises"
import path from "node:path"
import { ImageResponse } from "next/og"

// Selo-adesivo "10" (amarelo, contorno preto) usado como favicon e ícone do iPhone.
// Gerado como PNG para funcionar em todos os navegadores, inclusive Safari.
// `fundo`: cor atrás do círculo (o iOS pinta de preto o que for transparente).
export async function seloIcone(tamanho: number, fundo?: string) {
  const fonte = await readFile(path.join(process.cwd(), "src/assets/BowlbyOne-Regular.ttf"))
  const diametro = fundo ? Math.round(tamanho * 0.82) : tamanho
  const borda = Math.max(2, Math.round(diametro / 18))

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: fundo ?? "transparent",
        }}
      >
        <div
          style={{
            width: diametro,
            height: diametro,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffd731",
            border: `${borda}px solid #000000`,
            borderRadius: "50%",
            color: "#000000",
            fontFamily: "Bowlby One",
            fontSize: diametro * 0.46,
            paddingTop: diametro * 0.04,
          }}
        >
          10
        </div>
      </div>
    ),
    {
      width: tamanho,
      height: tamanho,
      fonts: [{ name: "Bowlby One", data: fonte, weight: 400, style: "normal" }],
    }
  )
}
