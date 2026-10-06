# Sistema — Pague Dez

## Propósito
Criar o hábito diário de exercício começando pelo mais simples: registrar flexões ("flecas").
Uso em segundos: abrir → número → **PAGUEI!** → (talvez) comemorar um recorde.

## Atores
| Ator | Papel no banco | O que faz |
|------|----------------|-----------|
| Admin | `ADMIN` | Cadastra usuários, ativa/desativa, promove a admin. Também paga flecas. |
| Pagador de Flecas | `USUARIO` | Registra séries, vê placar, recordes, taças, histórico e gráfico. |

O **primeiro cadastro** do sistema vira `ADMIN` automaticamente.

## Stack
- Next.js 16 (App Router, Server Components, Server Actions)
- NextAuth v5 — provider Credentials (email + senha com bcrypt), sessão **JWT** (60 dias)
- Prisma 5 + MySQL (`relationMode = "prisma"`)
- Tailwind CSS 4, lucide-react, framer-motion, canvas-confetti, recharts, sonner
- Vitest para testes unitários
- Deploy: Vercel (branch `main`)

## Variáveis de ambiente
| Variável | Uso |
|----------|-----|
| `DATABASE_URL` | MySQL do Pague Dez |
| `AUTH_SECRET` | Assinatura do JWT da sessão |
| `AUTH_TRUST_HOST` | `true` na Vercel |

## Identidade visual
Estilo "álbum de adesivos" inspirado no slush.app: papel pastel, contorno preto, pílulas, paleta de adesivos,
sem gradiente nem sombra. Fundo **azul** (masculino, padrão) ou **rosa** (feminino) via `data-sexo` no `<html>`.
Detalhes em `context/design.md`.
