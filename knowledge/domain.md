# Domínio — Pague Dez

## Vocabulário
| Termo | Significado |
|-------|-------------|
| Fleca | Flexão de braço no chão |
| Pagar dez | Fazer 10 flexões (a ordem do sargento) |
| Série / Registro | Um clique no PAGUEI! com a quantidade feita |
| Período | Dia, semana ISO (seg–dom), mês ou ano — sempre no horário de Brasília |
| Recorde | Maior total somado em um período |
| Taça | Troféu concedido ao bater um recorde |

## Regras de recorde (`src/lib/recordes.ts`)
1. O total de um período é a **soma** de todas as séries nele.
2. Há recorde quando o total do período atual é **estritamente maior** que o melhor período anterior do mesmo tipo.
3. Sem período anterior (ex.: primeira semana de uso) não há recorde daquele tipo.
4. Um único registro pode bater vários recordes ao mesmo tempo (dia + semana + mês...).

## Regras de taça (`src/lib/tacas.ts`, `src/server/flexoes.ts`)
1. **Primeiro registro da vida** → taça `PRIMEIRA` ("Recruta").
2. Bateu recorde em um período pela primeira vez → **nova taça** (com confetes).
3. Aumentou ainda mais no mesmo período → a taça existente tem o **valor atualizado** (aviso simples, sem nova taça).
4. `nivel` = número sequencial da conquista do usuário. Define:
   - **tamanho**: `escalaTaca(nivel)` cresce 6% por nível (máx. 2×);
   - **categoria**: pontos = nível + bônus do tipo (semanal +3, mensal +6, anual +10) →
     Bronze (0), Prata (3), Ouro (7), Platina (12), Diamante (18), Lendária (26).
   - Ouro+ ganha estrela; Diamante+ ganha joias; Lendária ganha coroa.

## Travas anti-sacanagem (`src/lib/limites.ts`)
Aplicadas **no servidor**, dentro da transação de `registrarSerie` (com `SELECT ... FOR UPDATE` na linha do usuário, para que
cliques simultâneos entrem um de cada vez). Os números ficam todos em `LIMITES` — é o único lugar para ajustar.

| Regra | Valor |
|-------|-------|
| Intervalo mínimo entre registros | 15 s |
| Máx. de registros na janela deslizante | 2 a cada 3 min |
| Teto de uma série | 200 (acima de 100 o app pergunta "foram mesmo N?") |
| Teto diário | 20 registros e 1000 flecas |

O botão mostra contagem regressiva ("descansando"); o servidor devolve `esperarSegundos`. O admin vê "⚠ Série suspeita" em quem
já registrou série acima de 100.

## Exclusão de série ("o guerreiro errou")
- Só séries **de hoje**. Três caminhos: botão **Desfazer** no aviso (8s) após registrar, link **"Errei o número, desfazer"** na tela de comemoração, e a lixeira em "Séries de hoje".
- Após excluir, as taças do período atual são recalculadas: se deixou de ser recorde, a taça é removida.
