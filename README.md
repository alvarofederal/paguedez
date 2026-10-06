# Pague Dez

> "Pague dez!" — registre suas flexões, bata recordes e conquiste taças.

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse http://localhost:3000, crie sua conta em **/cadastro** — o primeiro cadastro vira administrador.

## Variáveis de ambiente (`.env`)

```
DATABASE_URL="mysql://usuario:senha@host:3306/banco"
AUTH_SECRET="gere com: npx auth secret"
AUTH_TRUST_HOST=true
```

## Scripts

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm test` | Testes das regras de recorde e taças |
| `npm run db:push` | Aplica o `prisma/schema.prisma` no banco |
| `npm run build` | Gera o Prisma, aplica o schema e compila |

Documentação do projeto: veja `CLAUDE.md`.
