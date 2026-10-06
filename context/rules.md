# Regras e convenções — Pague Dez

## Código
- Nomes de domínio em português (registro, taça, recorde, período), como no restante do código.
- Regra de negócio nova → função pura em `src/lib` + teste em `tests/unit`.
- Acesso ao banco só em `src/server/*` (marcado com `import "server-only"`).
- Server Actions em `src/app/_actions`: retornam `{ erro: string | null, ... }`, nunca lançam para o cliente.
- Componentes client (`"use client"`) só quando há estado/eventos.
- Cores apenas via tokens CSS de `globals.css`.

## Nunca
- Nunca confiar só no front-end para limitar registros: toda trava vale no servidor (`src/lib/limites.ts`).
- Nunca alterar `prisma/schema.prisma` sem confirmar com o usuário.
- Nunca calcular "dia" com UTC — use `diaBrasilia()`.
- Nunca permitir apagar séries de dias anteriores (o histórico e as taças passadas são imutáveis).
- Nunca expor senha/hash em `select` de usuário.
- Nunca commitar `.env`.

## Checklist antes de subir
- [ ] `npm test` passando
- [ ] `npx tsc --noEmit` sem erros
- [ ] Testado no celular (largura ~375px) — o app é usado principalmente no telefone
