"use client"

import { estiloCampo, estiloRotulo } from "@/components/cartao-acesso"
import { SeletorNivel } from "@/components/seletor-nivel"
import { CORES_COMUNIDADE, corCss, type CorComunidade } from "@/lib/comunidade"
import type { NivelVisibilidade } from "@/lib/visibilidade"

export type EstadoComunidade = { nome: string; descricao: string; cor: CorComunidade; nivel: NivelVisibilidade }

// Campos do pelotão — usados para criar e para editar. O nível de visibilidade é decidido pelo DONO.
export function CamposComunidade({ valor, aoMudar, desabilitado }: { valor: EstadoComunidade; aoMudar: (v: EstadoComunidade) => void; desabilitado?: boolean }) {
  return (
    <>
      <div>
        <label htmlFor="nome-pelotao" className={estiloRotulo}>Nome do pelotão</label>
        <input id="nome-pelotao" value={valor.nome} onChange={(e) => aoMudar({ ...valor, nome: e.target.value })} disabled={desabilitado} required minLength={3} maxLength={40} placeholder="Ex.: Pelotão da Madrugada" className={estiloCampo} />
      </div>

      <div>
        <label htmlFor="descricao-pelotao" className={estiloRotulo}>Descrição (opcional)</label>
        <input id="descricao-pelotao" value={valor.descricao} onChange={(e) => aoMudar({ ...valor, descricao: e.target.value })} disabled={desabilitado} maxLength={140} placeholder="Ex.: Quem acorda cedo paga primeiro" className={estiloCampo} />
      </div>

      <fieldset>
        <legend className={estiloRotulo}>Cor do adesivo</legend>
        <div className="flex flex-wrap gap-2">
          {CORES_COMUNIDADE.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Cor ${c}`}
              aria-pressed={valor.cor === c}
              disabled={desabilitado}
              onClick={() => aoMudar({ ...valor, cor: c })}
              className={`h-10 w-10 rounded-full border border-black ${valor.cor === c ? "outline outline-2 outline-offset-2 outline-black" : ""}`}
              style={{ background: corCss(c) }}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={estiloRotulo}>O que os membros podem ver uns dos outros</legend>
        <p className="mb-2 ml-4 text-xs text-[var(--texto-3)]">Quem decide é você, o comandante. Vale para todos os membros do pelotão.</p>
        <SeletorNivel valor={valor.nivel} aoMudar={(nivel) => aoMudar({ ...valor, nivel })} desabilitado={desabilitado} />
      </fieldset>
    </>
  )
}
