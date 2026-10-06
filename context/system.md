# Sistema — Pague Dez

## Propósito
Criar o hábito diário de exercício começando pelo mais simples: registrar flexões ("flecas").
Uso em segundos: abrir → número → **PAGUEI!** → (talvez) comemorar um recorde.

## Atores
| Ator | Papel no banco | O que faz |
|------|----------------|-----------|
| Admin | `ADMIN` | Cadastra usuários e ativa/desativa. Nunca pode ser desativado. Também paga flecas. |
| Pagador de Flecas | `USUARIO` | Registra séries, vê placar, recordes, taças, histórico e gráfico. |

**Só existe um admin**: o dono do produto, identificado pelo email em `src/lib/admin.ts`. O papel é sempre derivado do email
(a coluna `papel` é só espelho) e não há como promover outros usuários.

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
| `NEXTAUTH_URL` | **Não definir na Vercel** (no `.env` local só serve p/ dev). Se apontar para outro endereço, redirecionamentos feitos no servidor vão para lá. O logout já é feito no navegador por isso. |

## Identidade visual
Estilo "álbum de adesivos" inspirado no slush.app: papel pastel, contorno preto, pílulas, paleta de adesivos,
sem gradiente nem sombra. Fundo **azul** (masculino, padrão) ou **rosa** (feminino) via `data-sexo` no `<html>`.
Detalhes em `context/design.md`.
