const MENSAGEM = ["Pague dez!", "Selva!", "Bata seu recorde", "Uma fleca de cada vez", "Missão dada é missão cumprida"]

export function FaixaRolante() {
  // Conteúdo duplicado para o loop contínuo (a animação desloca -50%)
  const itens = [...MENSAGEM, ...MENSAGEM, ...MENSAGEM, ...MENSAGEM]
  return (
    <div className="faixa-rolante rotulo py-2" aria-hidden="true">
      <div>
        {itens.map((m, i) => (
          <span key={i} className="mx-4">
            {m} ★
          </span>
        ))}
      </div>
    </div>
  )
}
