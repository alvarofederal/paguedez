"use client"

import { useState, useTransition } from "react"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { atualizarLembreteAction, criarLembreteAction, excluirLembreteAction } from "@/app/_actions/lembretes"
import { alternarDia, DIAS_SEMANA, temDia, TODOS_OS_DIAS } from "@/lib/lembretes"

type Item = { id: string; hora: string; diasSemana: number; somenteSePendente: boolean; ativo: boolean }

const SUGESTOES = [
  { hora: "07:00", rotulo: "Manhã" },
  { hora: "12:00", rotulo: "Almoço" },
  { hora: "18:00", rotulo: "Fim da tarde" },
  { hora: "21:00", rotulo: "Noite" },
]

function ItemLembrete({ item }: { item: Item }) {
  const [dados, setDados] = useState(item)
  const [pendente, iniciar] = useTransition()

  const salvar = (parcial: Partial<Item>) => {
    const antes = dados
    const novo = { ...dados, ...parcial }
    setDados(novo)
    iniciar(async () => {
      try {
        const r = await atualizarLembreteAction(item.id, parcial)
        if (r.erro) {
          setDados(antes)
          toast.error(r.erro)
        }
      } catch {
        setDados(antes)
        toast.error("Não foi possível salvar agora.")
      }
    })
  }

  const excluir = () => {
    if (!confirm(`Excluir o lembrete das ${dados.hora}?`)) return
    iniciar(async () => {
      const r = await excluirLembreteAction(item.id)
      if (r.erro) toast.error(r.erro)
      else toast.success("Lembrete excluído")
    })
  }

  return (
    <li className={`adesivo p-4 ${dados.ativo ? "" : "bg-[var(--nevoa)]"}`}>
      <div className="flex items-center justify-between gap-3">
        <input
          type="time"
          value={dados.hora}
          disabled={pendente}
          onChange={(e) => setDados({ ...dados, hora: e.target.value })}
          onBlur={() => dados.hora !== item.hora && /^\d{2}:\d{2}$/.test(dados.hora) && salvar({ hora: dados.hora })}
          aria-label="Horário do lembrete"
          className="display rounded-full border border-black bg-white px-4 py-1.5 text-2xl outline-none focus:bg-[var(--lavado)]"
        />
        <div className="flex items-center gap-2">
          <label className="rotulo flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={dados.ativo} disabled={pendente} onChange={(e) => salvar({ ativo: e.target.checked })} className="h-4 w-4 accent-black" />
            Ativo
          </label>
          <button onClick={excluir} disabled={pendente} className="pilula pilula-fantasma !p-2" aria-label="Excluir lembrete" title="Excluir">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Dias da semana">
        {DIAS_SEMANA.map((nome, i) => {
          const ligado = temDia(dados.diasSemana, i)
          return (
            <button
              key={nome}
              type="button"
              aria-pressed={ligado}
              disabled={pendente}
              onClick={() => {
                const nova = alternarDia(dados.diasSemana, i)
                if (nova === 0) return void toast.error("Deixe pelo menos um dia marcado.")
                salvar({ diasSemana: nova })
              }}
              className={`pilula ${ligado ? "pilula-cheia" : "pilula-fantasma"} !px-3 !py-1.5 text-xs`}
            >
              {nome}
            </button>
          )
        })}
      </div>

      <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={dados.somenteSePendente}
          disabled={pendente}
          onChange={(e) => salvar({ somenteSePendente: e.target.checked })}
          className="h-4 w-4 accent-black"
        />
        Só avisar se eu ainda não paguei flecas hoje
      </label>
    </li>
  )
}

export function AgendaLembretes({ lembretes, limite, semAparelho }: { lembretes: Item[]; limite: number; semAparelho: boolean }) {
  const [pendente, iniciar] = useTransition()
  const cheio = lembretes.length >= limite

  const criar = (hora: string) =>
    iniciar(async () => {
      try {
        const r = await criarLembreteAction({ hora, diasSemana: TODOS_OS_DIAS, somenteSePendente: true })
        if (r.erro) toast.error(r.erro)
        else toast.success(`Lembrete das ${hora} criado`)
      } catch {
        toast.error("Não foi possível criar agora.")
      }
    })

  return (
    <div className="space-y-3">
      {semAparelho && lembretes.length > 0 && (
        <p className="rounded-[14px] border border-black bg-[var(--sol)] p-3 text-sm font-bold">
          Atenção: nenhum aparelho está ativado. Ative as notificações acima, senão os lembretes não chegam.
        </p>
      )}

      {lembretes.length === 0 ? (
        <p className="adesivo p-5 text-center font-bold">Nenhum lembrete ainda. Comece por um dos horários abaixo.</p>
      ) : (
        <ul className="space-y-3">
          {lembretes.map((l) => (
            <ItemLembrete key={`${l.id}`} item={l} />
          ))}
        </ul>
      )}

      {cheio ? (
        <p className="text-center text-sm font-medium">Você chegou ao limite de {limite} lembretes.</p>
      ) : (
        <div className="adesivo p-4">
          <p className="rotulo mb-2">
            <Plus className="mr-1 inline h-3.5 w-3.5" /> Adicionar lembrete ({lembretes.length}/{limite})
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGESTOES.map((s) => (
              <button key={s.hora} onClick={() => criar(s.hora)} disabled={pendente} className="pilula pilula-fantasma !px-3 !py-2 text-xs">
                {s.hora} · {s.rotulo}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-[var(--texto-3)]">Depois de criar, ajuste o horário e os dias do jeito que preferir.</p>
        </div>
      )}
    </div>
  )
}
