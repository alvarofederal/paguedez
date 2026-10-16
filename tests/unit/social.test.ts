import { describe, expect, it } from "vitest"
import { limitesDoPeriodo } from "@/lib/periodos"
import { normalizarTelefoneBR } from "@/lib/telefone"
import { faltamParaPassar, ordenarRanking } from "@/lib/ranking"
import { avaliarCriacaoConvite, dataDeExpiracao, mensagemPadrao, statusEfetivo, textoFinal, urlWhatsapp } from "@/lib/convites"
import { emblemasMerecidos, type EstatisticasEmblemas } from "@/lib/emblemas"
import { LIMITES_SOCIAL, limiteDeAmigos } from "@/lib/planos"
import { nivelValido, podeVerDetalhes, podeVerRecordes } from "@/lib/visibilidade"
import { proximoSeguro } from "@/lib/comunidade"
import { socialAtivo } from "@/lib/social-flag"

describe("limitesDoPeriodo", () => {
  it("cobre dia, semana (seg–dom), mês e ano", () => {
    expect(limitesDoPeriodo("DIARIO", "2026-10-06")).toEqual({ de: "2026-10-06", ate: "2026-10-06" })
    expect(limitesDoPeriodo("SEMANAL", "2026-10-06")).toEqual({ de: "2026-10-05", ate: "2026-10-11" }) // terça
    expect(limitesDoPeriodo("SEMANAL", "2026-10-11")).toEqual({ de: "2026-10-05", ate: "2026-10-11" }) // domingo
    expect(limitesDoPeriodo("SEMANAL", "2026-10-05")).toEqual({ de: "2026-10-05", ate: "2026-10-11" }) // segunda
    expect(limitesDoPeriodo("MENSAL", "2026-10-06")).toEqual({ de: "2026-10-01", ate: "2026-10-31" })
    expect(limitesDoPeriodo("ANUAL", "2026-10-06")).toEqual({ de: "2026-01-01", ate: "2026-12-31" })
  })

  it("semana que cruza o mês", () => {
    expect(limitesDoPeriodo("SEMANAL", "2026-10-01")).toEqual({ de: "2026-09-28", ate: "2026-10-04" })
  })
})

describe("normalizarTelefoneBR", () => {
  it("aceita vários formatos e monta número e máscara", () => {
    for (const entrada of ["(11) 99999-8888", "11999998888", "+55 11 99999-8888", "5511999998888"]) {
      expect(normalizarTelefoneBR(entrada)).toEqual({ numero: "5511999998888", mascara: "(11) 9****-8888" })
    }
  })

  it("rejeita número curto, DDD inválido e celular sem 9", () => {
    expect(normalizarTelefoneBR("99999")).toHaveProperty("erro")
    expect(normalizarTelefoneBR("(05) 99999-8888")).toHaveProperty("erro")
    expect(normalizarTelefoneBR("(11) 89999-8888")).toHaveProperty("erro")
  })

  it("aceita número antigo de 10 dígitos", () => {
    expect(normalizarTelefoneBR("(11) 3333-4444")).toEqual({ numero: "551133334444", mascara: "(11) ****-4444" })
  })
})

describe("ordenarRanking", () => {
  const d = (h: number) => new Date(`2026-10-06T${String(h).padStart(2, "0")}:00:00Z`)

  it("ordena por total e desempata por quem chegou primeiro", () => {
    const r = ordenarRanking([
      { userId: "a", name: "Ana", total: 50, ultimoEm: d(15) },
      { userId: "b", name: "Beto", total: 80, ultimoEm: d(12) },
      { userId: "c", name: "Caio", total: 50, ultimoEm: d(10) },
      { userId: "d", name: "Dani", total: 0, ultimoEm: null },
    ])
    expect(r.map((x) => [x.userId, x.posicao])).toEqual([["b", 1], ["c", 2], ["a", 3], ["d", 4]])
  })

  it("quem não pagou nada fica no fim, em ordem alfabética", () => {
    const r = ordenarRanking([
      { userId: "z", name: "Zé", total: 0, ultimoEm: null },
      { userId: "a", name: "Ana", total: 0, ultimoEm: null },
    ])
    expect(r.map((x) => x.userId)).toEqual(["a", "z"])
  })

  it("diz quantas flecas faltam para passar o da frente", () => {
    const r = ordenarRanking([
      { userId: "a", name: "Ana", total: 50, ultimoEm: d(10) },
      { userId: "b", name: "Beto", total: 38, ultimoEm: d(11) },
    ])
    expect(faltamParaPassar(r, "b")).toEqual({ nome: "Ana", faltam: 13 })
    expect(faltamParaPassar(r, "a")).toBeNull()
  })
})

describe("convites", () => {
  const folga = { amigos: 0, pendentes: 0, criadosUltimas24h: 0, limiteAmigos: null }

  it("libera quando há folga", () => {
    expect(avaliarCriacaoConvite(folga)).toEqual({ ok: true })
  })

  it("barra excesso de convites no dia e de pendentes", () => {
    expect(avaliarCriacaoConvite({ ...folga, criadosUltimas24h: LIMITES_SOCIAL.convitesPorDia })).toMatchObject({ ok: false, motivo: "DIA" })
    expect(avaliarCriacaoConvite({ ...folga, pendentes: LIMITES_SOCIAL.convitesPendentes })).toMatchObject({ ok: false, motivo: "PENDENTES" })
  })

  it("com limite de plano, amigos + pendentes ocupam as vagas", () => {
    expect(avaliarCriacaoConvite({ ...folga, amigos: 2, pendentes: 0, limiteAmigos: 3 })).toEqual({ ok: true })
    expect(avaliarCriacaoConvite({ ...folga, amigos: 2, pendentes: 1, limiteAmigos: 3 })).toMatchObject({ ok: false, motivo: "PLANO" })
    expect(avaliarCriacaoConvite({ ...folga, amigos: 3, pendentes: 0, limiteAmigos: 3 })).toMatchObject({ ok: false, motivo: "PLANO" })
  })

  it("limite de amigos só existe com cobrança ativa e plano grátis", () => {
    expect(limiteDeAmigos("GRATIS", false)).toBeNull()
    expect(limiteDeAmigos("GRATIS", true)).toBe(LIMITES_SOCIAL.amigosGratis)
    expect(limiteDeAmigos("OFICIAL", true)).toBeNull()
  })

  it("convite pendente vencido vale como expirado", () => {
    const agora = new Date("2026-10-06T12:00:00Z")
    const exp = dataDeExpiracao(agora)
    expect(statusEfetivo("PENDENTE", exp, agora)).toBe("PENDENTE")
    expect(statusEfetivo("PENDENTE", exp, new Date(exp.getTime() + 1))).toBe("EXPIRADO")
    expect(statusEfetivo("ACEITO", exp, new Date(exp.getTime() + 1))).toBe("ACEITO")
  })

  it("monta o link do WhatsApp com o texto e o link do convite", () => {
    const texto = textoFinal(mensagemPadrao("Silva", "Álvaro"), "https://x.app/convite/abc")
    expect(texto.endsWith("\nhttps://x.app/convite/abc")).toBe(true)
    const url = urlWhatsapp(texto, "5511999998888")
    expect(url.startsWith("https://wa.me/5511999998888?text=")).toBe(true)
    expect(decodeURIComponent(url.split("text=")[1])).toBe(texto)
    expect(urlWhatsapp("oi").startsWith("https://wa.me/?text=")).toBe(true)
  })

  it("mensagem de pelotão cita o nome do pelotão", () => {
    expect(mensagemPadrao("Silva", "Álvaro", "Madrugada")).toContain("Madrugada")
  })
})

describe("emblemas", () => {
  const zero: EstatisticasEmblemas = { temTacaRecruta: false, convitesAceitos: 0, comunidadesCriadas: 0, diasComFlecas: 0, totalFlecas: 0 }

  it("ninguém ganha nada sem fazer nada", () => {
    expect(emblemasMerecidos(zero)).toEqual([])
  })

  it("Recrutador vem do primeiro convite aceito", () => {
    expect(emblemasMerecidos({ ...zero, convitesAceitos: 1 })).toEqual(["RECRUTADOR"])
  })

  it("aplica cada regra no seu limite", () => {
    const tudo = emblemasMerecidos({ temTacaRecruta: true, convitesAceitos: 1, comunidadesCriadas: 1, diasComFlecas: 7, totalFlecas: 100 })
    expect([...tudo].sort()).toEqual(["CENTENARIO", "COMANDANTE", "PERSISTENTE", "RECRUTA", "RECRUTADOR"])
    expect(emblemasMerecidos({ ...zero, diasComFlecas: 6, totalFlecas: 99 })).toEqual([])
  })
})

describe("visibilidade", () => {
  it("níveis cumulativos", () => {
    expect(podeVerRecordes(0)).toBe(false)
    expect(podeVerRecordes(1)).toBe(true)
    expect(podeVerDetalhes(1)).toBe(false)
    expect(podeVerDetalhes(2)).toBe(true)
    expect(nivelValido(2)).toBe(true)
    expect(nivelValido(3)).toBe(false)
    expect(nivelValido("1")).toBe(false)
  })
})

describe("chave do social e redirecionamento seguro", () => {
  it("social vem ligado e só desliga com FEATURE_SOCIAL=false", () => {
    const antes = process.env.FEATURE_SOCIAL
    delete process.env.FEATURE_SOCIAL
    expect(socialAtivo()).toBe(true)
    process.env.FEATURE_SOCIAL = "false"
    expect(socialAtivo()).toBe(false)
    process.env.FEATURE_SOCIAL = "true"
    expect(socialAtivo()).toBe(true)
    if (antes === undefined) delete process.env.FEATURE_SOCIAL
    else process.env.FEATURE_SOCIAL = antes
  })

  it("o destino pós-login só pode ser convite ou pelotão (sem redirecionamento aberto)", () => {
    expect(proximoSeguro("/convite/abcdef123456")).toBe("/convite/abcdef123456")
    expect(proximoSeguro("/c/ESMk6H1S")).toBe("/c/ESMk6H1S")
    for (const ruim of ["https://evil.com", "//evil.com", "/admin/usuarios", "/convite/../x", "/convite/", "/c/a", undefined, null, ""]) {
      expect(proximoSeguro(ruim as string | undefined)).toBe("/")
    }
  })
})
