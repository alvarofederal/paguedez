import "server-only"
import prisma from "@/lib/prisma"
import { diaBrasilia } from "@/lib/periodos"
import { ESCADA, indiceDaPatente } from "@/lib/patentes"
import { LIMITES_LEMBRETES } from "@/lib/planos"
import {
  agoraEmBrasilia,
  avaliarLembrete,
  horaValida,
  mascaraValida,
  montarMensagem,
  naJanela,
  ordenarPorHora,
  type PayloadPush,
} from "@/lib/lembretes"
import { patentesDe } from "./patentes"
import { enviarPush, type Entrega } from "./push"

export type DadosLembrete = { hora: string; diasSemana: number; somenteSePendente: boolean }

function validar(d: Partial<DadosLembrete>): string | null {
  if (d.hora !== undefined && !horaValida(d.hora)) return "Horário inválido. Use o formato HH:MM."
  if (d.diasSemana !== undefined && !mascaraValida(d.diasSemana)) return "Escolha pelo menos um dia da semana."
  return null
}

export async function listarLembretes(userId: string) {
  return ordenarPorHora(await prisma.lembrete.findMany({ where: { userId }, orderBy: { criadoEm: "asc" } }))
}

export function contarLembretesAtivos(userId: string) {
  return prisma.lembrete.count({ where: { userId, ativo: true } })
}

export async function criarLembrete(userId: string, dados: DadosLembrete) {
  const erro = validar(dados)
  if (erro) return { erro }
  const total = await prisma.lembrete.count({ where: { userId } })
  if (total >= LIMITES_LEMBRETES.porUsuario) return { erro: `Você já tem ${LIMITES_LEMBRETES.porUsuario} lembretes, que é o máximo.` }
  const l = await prisma.lembrete.create({ data: { userId, ...dados } })
  return { erro: null, id: l.id }
}

export async function atualizarLembrete(userId: string, id: string, dados: Partial<DadosLembrete> & { ativo?: boolean }) {
  const erro = validar(dados)
  if (erro) return { erro }
  const { count } = await prisma.lembrete.updateMany({ where: { id, userId }, data: dados })
  return count > 0 ? { erro: null } : { erro: "Lembrete não encontrado." }
}

export async function excluirLembrete(userId: string, id: string) {
  const l = await prisma.lembrete.findFirst({ where: { id, userId }, select: { id: true } })
  if (!l) return { erro: "Lembrete não encontrado." }
  await prisma.$transaction([prisma.lembreteEnvio.deleteMany({ where: { lembreteId: id } }), prisma.lembrete.delete({ where: { id } })])
  return { erro: null }
}

/** Notificação de teste, para o usuário conferir se o aparelho está recebendo. */
export async function enviarTeste(userId: string, agora = new Date(), enviar: typeof enviarPush = enviarPush): Promise<{ erro: string | null } & Partial<Entrega>> {
  const inscricoes = await prisma.pushInscricao.findMany({ where: { userId }, select: { id: true, ultimoTesteEm: true } })
  if (inscricoes.length === 0) return { erro: "Nenhum aparelho ativado. Toque em \"Ativar neste aparelho\" primeiro." }

  const recente = inscricoes.some((i) => i.ultimoTesteEm && agora.getTime() - i.ultimoTesteEm.getTime() < LIMITES_LEMBRETES.intervaloTesteSeg * 1000)
  if (recente) return { erro: `Aguarde ${LIMITES_LEMBRETES.intervaloTesteSeg} segundos entre um teste e outro.` }
  await prisma.pushInscricao.updateMany({ where: { userId }, data: { ultimoTesteEm: agora } })

  const r = await enviar(userId, {
    titulo: "Teste do Pague Dez",
    corpo: "Se você está vendo isto, os lembretes funcionam neste aparelho.",
    url: "/lembretes",
    tag: "teste-pague-dez",
  })
  if (r.enviadas === 0) return { erro: "Não consegui entregar a notificação. Desative e ative o aparelho de novo.", ...r }
  return { erro: null, ...r }
}

export type ResumoExecucao = {
  avaliados: number
  enviados: number
  jaPagaram: number
  semAparelho: number
  falhas: number
  removidos: number
}

async function recordeDiario(userId: string): Promise<number> {
  const dias = await prisma.registro.groupBy({ by: ["dia"], where: { userId }, _sum: { quantidade: true } })
  return dias.reduce((m, d) => Math.max(m, d._sum.quantidade ?? 0), 0)
}

/**
 * Chamada pelo agendador (cron). Pode rodar com qualquer frequência: cada lembrete dispara no máximo UMA vez por dia
 * (a chave única de LembreteEnvio é a trava) e só dentro da janela de tolerância do horário marcado.
 * `enviar` é injetável para os testes não mandarem push de verdade.
 */
export async function executarLembretes(agora = new Date(), enviar: typeof enviarPush = enviarPush): Promise<ResumoExecucao> {
  const resumo: ResumoExecucao = { avaliados: 0, enviados: 0, jaPagaram: 0, semAparelho: 0, falhas: 0, removidos: 0 }
  const hoje = agoraEmBrasilia(agora)
  const dia = diaBrasilia(agora)

  const ativos = await prisma.lembrete.findMany({ where: { ativo: true } })
  const naHora = ativos.filter((l) => naJanela(l, hoje, LIMITES_LEMBRETES.toleranciaMinutos) === "SIM")
  if (naHora.length === 0) return resumo

  const userIds = [...new Set(naHora.map((l) => l.userId))]
  const [usuarios, totais, jaProcessados, patentes] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: userIds }, ativo: true }, select: { id: true } }),
    prisma.registro.groupBy({ by: ["userId"], where: { userId: { in: userIds }, dia }, _sum: { quantidade: true } }),
    prisma.lembreteEnvio.findMany({ where: { lembreteId: { in: naHora.map((l) => l.id) }, dia }, select: { lembreteId: true } }),
    patentesDe(userIds),
  ])
  const usuarioAtivo = new Set(usuarios.map((u) => u.id))
  const totalHoje = new Map(totais.map((t) => [t.userId, t._sum.quantidade ?? 0]))
  const processados = new Set(jaProcessados.map((p) => p.lembreteId))
  const semente = Math.floor(agora.getTime() / 86_400_000)

  for (const l of naHora) {
    if (!usuarioAtivo.has(l.userId)) continue
    const total = totalHoje.get(l.userId) ?? 0
    const decisao = avaliarLembrete(l, hoje, { jaProcessadoHoje: processados.has(l.id), jaPagouHoje: total > 0 }, LIMITES_LEMBRETES.toleranciaMinutos)
    if (decisao !== "ENVIAR" && decisao !== "JA_PAGOU") continue
    resumo.avaliados++

    // Reserva o (lembrete, dia) ANTES de enviar: se duas execuções se sobrepuserem, só uma consegue reservar
    try {
      await prisma.lembreteEnvio.create({ data: { lembreteId: l.id, dia } })
    } catch (erro) {
      if ((erro as { code?: string }).code === "P2002") continue
      throw erro
    }

    if (decisao === "JA_PAGOU") {
      resumo.jaPagaram++
      await prisma.lembreteEnvio.update({ where: { lembreteId_dia: { lembreteId: l.id, dia } }, data: { status: "IGNORADO_JA_PAGOU" } })
      continue
    }

    const payload: PayloadPush = montarMensagem({
      totalHoje: total,
      recordeDiario: total > 0 ? await recordeDiario(l.userId) : 0,
      tratamento: ESCADA[indiceDaPatente(patentes[l.userId] ?? "RECRUTA")].titulo,
      semente,
    })

    const entrega = await enviar(l.userId, payload).catch((erro) => {
      console.error("Erro ao enviar lembrete:", erro)
      return { enviadas: 0, removidas: 0, falhas: 1 } satisfies Entrega
    })
    resumo.removidos += entrega.removidas
    const chave = { lembreteId_dia: { lembreteId: l.id, dia } }

    if (entrega.enviadas > 0) {
      resumo.enviados++
      await prisma.lembreteEnvio.update({ where: chave, data: { status: "ENVIADO", detalhe: `${entrega.enviadas} aparelho(s)` } })
    } else if (entrega.falhas === 0) {
      resumo.semAparelho++
      await prisma.lembreteEnvio.update({ where: chave, data: { status: "SEM_INSCRICAO" } })
    } else {
      resumo.falhas++
      await prisma.lembreteEnvio.update({ where: chave, data: { status: "FALHOU", detalhe: `${entrega.falhas} falha(s)` } })
    }
  }
  return resumo
}
