# Pague Dez — Guia para Claude Code

> Carregado automaticamente em toda sessão. Leia antes de alterar o projeto.

## O que é

**Pague Dez** é um app de uso diário para registrar flexões de braço ("flecas"), bater recordes
(diário, semanal, mensal, anual) e conquistar taças cada vez maiores. Nome inspirado no
"pague dez!" dos sargentos do exército — o gancho de viralização é o público militar/ex-militar.

Stack: Next.js 16 (App Router) + TypeScript + MySQL (Prisma 5) + NextAuth v5 (Credentials, sessão JWT) + Tailwind 4 + Vercel.
**Versão:** 0.1.0 (MVP) | **Branch principal:** `main` (deploy automático na Vercel)

## Arquivos de contexto

| Arquivo | Quando ler |
|---------|-----------|
| `context/system.md` | Visão geral, atores, stack |
| `context/architecture.md` | Pastas e camadas |
| `context/rules.md` | Convenções e o que nunca fazer |
| `context/design.md` | Identidade visual (tokens, componentes, tema por sexo) |
| `knowledge/domain.md` | Regras de recorde e taças (o coração do app) |
| `knowledge/database.md` | Schema Prisma |
| `knowledge/api.md` | Server Actions |
| `planning/paguedez-visao.md` | Visão do produto, ideias e monetização |
| `planning/roadmap.md` / `backlog.md` / `releases.md` | Planejamento |
| `development/features.md` / `bugs.md` / `improvements.md` | Andamento |

## Regras críticas

1. **Não alterar o schema Prisma sem confirmar com o usuário.** O build roda `prisma db push` no banco real.
2. **Datas sempre em America/Sao_Paulo** — use `diaBrasilia()` de `src/lib/periodos.ts`, nunca `new Date().toISOString().slice(0,10)`.
3. **Regras de recorde ficam em funções puras** (`src/lib/recordes.ts`, `src/lib/tacas.ts`) com testes em `tests/unit`. Mudou regra → atualize o teste.
4. **Recorde = total somado no período**, estritamente maior que o melhor período anterior. Empate não é recorde.
5. **Uma taça por (usuário, tipo, período)**; ampliar o recorde no mesmo período atualiza o valor, não cria outra.
6. Sempre `import prisma from "@/lib/prisma"` e `usuarioAtual()` de `@/lib/auth` (busca papel/sexo/ativo frescos no banco).
7. Sempre validar entrada com Zod (`src/lib/validators.ts`) nas Server Actions.
8. Visual segue `context/design.md` (estilo slush.app): tokens de `globals.css`, contorno preto, pílulas, **sem gradiente nem sombra**. Tema azul/rosa por `data-sexo` no `<html>`.

## Padrão de Server Action

```typescript
"use server"
const user = await usuarioAtual()
if (!user) return { erro: "Sessão expirada. Entre novamente." }
// valida com Zod → chama src/server/* → revalidatePath
```

## Comandos

```bash
npm run dev        # http://localhost:3000
npm test           # testes unitários das regras de recorde
npm run build      # prisma generate + db push + next build
```

## Telas

| Rota | Descrição |
|------|-----------|
| `/login`, `/cadastro` | Acesso (o primeiro cadastro do sistema vira ADMIN) |
| `/` | Campo de quantidade + botão PAGUEI! + placar do dia/semana/mês/ano |
| `/historico` | Recordes atuais, gráfico de 30 dias, galeria de taças, últimas séries |
| `/admin/usuarios` | Admin: cadastrar, ativar/desativar, promover usuários |
