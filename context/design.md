# Identidade visual — Pague Dez

Referência: **slush.app** ("universo de adesivos infláveis sobre papel pastel"), adaptada ao Pague Dez.
Tokens vivem em `src/app/globals.css`. Nunca use cor fora deles.

## Princípios
- **Papel pastel + contorno preto 1px** em tudo que é interativo (cards, botões, campos, nav) — efeito "adesivo recortado à mão".
- **Sem gradiente e sem sombra.** Volume vem de cor chapada (ex.: meia-face escura nas taças), nunca de degradê.
- **Paleta de adesivos compartilhada**: várias cores por tela, nenhuma é "a" cor de destaque.
- **Ação principal = preto cheio** (`.pilula-cheia`, `.botao-pagar`). Secundária = branco com contorno (`.pilula-fantasma`).
- **Tudo arredondado**: botões/pílulas/nav 1600px, cards 20px (`.adesivo`), cards grandes 40px (`.adesivo-grande`).
- **Display gigante e espremido**: `.display` (Bowlby One, maiúsculas, line-height 0.8) sempre acompanhado de adesivos decorativos girados.
- Movimento só na faixa rolante (marquee) e na comemoração de recorde.

## Tema por sexo
| Token | Masculino (padrão) | Feminino |
|-------|--------------------|----------|
| `--lavado` (fundo da página) | `#dceeff` | `#ffe3f1` |
| `--marca` (cor dominante: disco do PAGUEI!, card "Hoje", barras do gráfico) | `#4da2ff` | `#ff6fb5` |
| `--marca-suave` | `#b9dcff` | `#ffc2e0` |

Aplicado por `data-sexo` no `<html>` (layout raiz, a partir do usuário logado).

## Paleta de adesivos
| Token | Cor | Uso típico |
|-------|-----|-----------|
| `--carbono` | `#000000` | Texto, contornos, ação principal |
| `--papel` | `#ffffff` | Cards, campos, botões fantasma |
| `--nevoa` | `#e9e9e9` | Hover, desativado |
| `--menta` | `#55db9c` | Card "Semana", adesivo "Selva!" |
| `--lavanda` | `#e9ccff` | Card "Mês", "Última taça" |
| `--sol` | `#ffd731` | Card "Ano", selo "10", badge de categoria |
| `--brasa` | `#fb4903` | Adesivo decorativo, destrutivo |
| `--violeta` | `#5c4ade` | Taça Lendária |
| `--eletrico` / `--chiclete` | `#4da2ff` / `#ff6fb5` | Marcadores de sexo no admin |

## Tipografia
- **Display**: Bowlby One (substituto livre do Lateral 800) — classe `.display`.
- **UI**: Inter 500/700 (substituto do Aeonik Pro) — corpo com `letter-spacing: -0.01em`, números tabulares.
- **Rótulos**: `.rotulo` — 12px, 700, maiúsculas, `letter-spacing: 0.032em`.

## Landing page (`src/app/_components/landing.tsx`)
Faixas de cor alternadas (`--lavado`, branco, `--nevoa`, lavanda), títulos `.display` gigantes, adesivos girados e cards coloridos.
Cuidado: com `line-height: 0.8`, acento/til em maiúsculas no MEIO do título some atrás da linha de cima (preto sobre preto) —
evite palavras como NÃO/AÇÃO no meio de títulos de várias linhas. Ao usar `.pilula` não combine com `hidden` (a classe vence): envolva num `<span className="hidden sm:block">`.

## Componentes-chave
- **Faixa rolante** (`FaixaRolante`): tarja preta no topo com mensagens militares.
- **Nav inferior**: pílula branca flutuante; item ativo preto cheio.
- **Botão PAGUEI!**: círculo preto dentro de um disco `--marca` com contorno.
- **Placar**: 4 adesivos coloridos levemente girados (Hoje/Semana/Mês/Ano).
- **Taça**: SVG chapado com contorno preto; selo-estrela atrás a partir da Prata; estrela na copa a partir do Ouro; coroa na Lendária.
