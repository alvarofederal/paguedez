# Server Actions e rotas — Pague Dez

## Autenticação
| Rota | Descrição |
|------|-----------|
| `/api/auth/[...nextauth]` | Handlers do NextAuth (login por credenciais, sessão JWT) |

## Server Actions (`src/app/_actions`)
| Action | Quem | Entrada | Retorno |
|--------|------|---------|---------|
| `pagarFlecas` | logado | `quantidade` (1–1000) | `{ erro, conquistas[], resumo[] }` |
| `apagarSerie` | logado (dono) | `registroId` — só de hoje | `{ erro }` |
| `cadastrar` | público | name, email, password (≥6), sexo | `{ erro, id? }` |
| `adminCriarUsuario` | ADMIN | + papel | `{ erro, id? }` |
| `adminAlternarAtivo` | ADMIN | userId (não a si mesmo) | `{ erro }` |
| `adminAlternarPapel` | ADMIN | userId (não a si mesmo) | `{ erro }` |
| `sair` | logado | — | redireciona para `/login` |

`conquistas[]`: `{ tipo, periodo, valor, nivel, nova }` — `nova=false` quando só ampliou um recorde já batido no período.
