# Patentes — Recruta a Comandante

> Status: **implementado em 2026-10-16** com regras **propostas por Claude** (o dono pediu ajuda para defini-las).
> Todos os números vivem em **`src/lib/patentes.ts`** — para deixar mais fácil ou mais difícil, é editar lá (e rodar `npm test`).

## As 10 patentes
Recruta → Soldado → Cabo → Sargento → Tenente → Capitão → Major → Coronel → General → Comandante.
Praças (Soldado, Cabo, Sargento) têm **divisas** na insígnia; oficiais (Tenente a General) têm **estrelas** (1 a 5); o Comandante tem **coroa**.

## Como se sobe (proposta)
Uma patente só é conquistada quando **todos** os requisitos dela estão cumpridos:

| Patente | Flecas válidas | Dias pagos | Recrutas ativos |
|---------|---------------:|-----------:|----------------:|
| Recruta | — (ponto de partida) | — | — |
| Soldado | 100 | 3 | — |
| Cabo | 500 | 7 | — |
| Sargento | 1.500 | 15 | 1 |
| Tenente | 3.000 | 30 | 2 |
| Capitão | 5.000 | 45 | 3 |
| Major | 10.000 | 75 | 5 |
| Coronel | 20.000 | 120 | 8 |
| General | 40.000 | 200 | 12 |
| Comandante | 100.000 | 365 | 20 |

Ritmo de referência (100 flecas/dia): Soldado no 3º dia, Cabo em 1 semana, Sargento em ~15 dias, Major em ~100 dias, Coronel em ~7 meses,
General em ~1 ano e meio, Comandante é lenda (≈ 3 anos a 100/dia; 1 ano a 300/dia).

## A garantia de que pagou (contra "clicar à toa")
1. **Dia pago**: só conta como dia ativo quem fez **pelo menos 10 flecas** naquele dia ("pague dez!").
2. **Teto diário para a patente**: no máximo **300 flecas por dia** contam (o excedente continua valendo para recordes e taças, não para patente).
3. **Constância obrigatória**: toda patente exige um mínimo de **dias pagos** — não dá para comprar patente num dia só. Os dias exigidos nunca são menores que o necessário no ritmo máximo contável.
4. **Recruta ativo**: a partir de Sargento é preciso recrutar amigos que **pagaram flecas em 3 dias diferentes** (convidar conta fantasma não adianta) e cuja conta continua ativa.
5. **A patente nunca desce**: cada patente conquistada fica guardada; desfazer uma série ou um recruta sair não rebaixa.
6. Por baixo de tudo, as **travas do botão PAGUEI!** (intervalo de 15 s, 2 registros a cada 3 min, série até 200, 20 registros e 1000 flecas por dia).

Se o recurso social for desligado (`FEATURE_SOCIAL=false`), a exigência de recrutas é ignorada (senão ninguém passaria de Cabo).

## Onde aparece
- **Tela Pagar**: card "Sua patente" com barras do que falta (flecas, dias, recrutas) e tela de **Promovido!** com confete, uma única vez.
- **`/patentes`**: escada completa (conquistadas com data, atual, bloqueadas em cinza) e a explicação das regras.
- **Rankings** (amigos e pelotões): abreviação da patente ao lado do nome (Rec, Sd, Cb, Sgt, Ten, Cap, Maj, Cel, Gen, Cmt).
- Atalho "Patentes" na **Tropa**.

## Decisões em aberto (para o dono)
1. Os números da tabela estão bons ou quer mais fácil/difícil? (ex.: "dez mil flecas" hoje é Major.)
2. O teto de 300 flecas/dia para patente está bom?
3. Recrutas ativos: 3 dias pagos é o ideal para "ativo"?
4. Patente deve render algo (ex.: poder convidar mais amigos, selo no perfil, desconto no plano pago)? Combinar com a decisão do que é pago.
5. Mais de uma "tabela" no futuro (patente por exercício quando houver outros exercícios)?
