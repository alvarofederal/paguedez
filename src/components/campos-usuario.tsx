"use client"

import { estiloCampo, estiloRotulo } from "./cartao-acesso"

type Sexo = "MASCULINO" | "FEMININO"

// Campos comuns ao cadastro público e ao cadastro pelo admin
export function CamposUsuario({
  sexo,
  aoMudarSexo,
}: {
  sexo: Sexo | null
  aoMudarSexo: (sexo: Sexo) => void
}) {
  return (
    <>
      <div>
        <label htmlFor="name" className={estiloRotulo}>Nome</label>
        <input id="name" name="name" required minLength={2} maxLength={80} autoComplete="name" placeholder="Nome de guerra" className={estiloCampo} />
      </div>
      <div>
        <label htmlFor="email" className={estiloRotulo}>Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" placeholder="seu@email.com" className={estiloCampo} />
      </div>
      <div>
        <label htmlFor="password" className={estiloRotulo}>Senha</label>
        <input id="password" name="password" type="password" required minLength={6} autoComplete="new-password" placeholder="Mínimo 6 caracteres" className={estiloCampo} />
      </div>
      <fieldset>
        <legend className={estiloRotulo}>Sexo</legend>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { valor: "MASCULINO", rotulo: "Masculino", cor: "#4da2ff" },
              { valor: "FEMININO", rotulo: "Feminino", cor: "#ff6fb5" },
            ] as const
          ).map((opcao) => {
            const escolhido = sexo === opcao.valor
            return (
              <button
                key={opcao.valor}
                type="button"
                onClick={() => aoMudarSexo(opcao.valor)}
                aria-pressed={escolhido}
                className="pilula !py-3.5"
                style={{ background: escolhido ? opcao.cor : "#fff" }}
              >
                <span
                  className="h-3 w-3 rounded-full border border-black"
                  style={{ background: escolhido ? "#000" : opcao.cor }}
                />
                {opcao.rotulo}
              </button>
            )
          })}
        </div>
      </fieldset>
    </>
  )
}
