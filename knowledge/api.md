# Server Actions e rotas — Pague Dez

## Autenticação
| Rota | Descrição |
|------|-----------|
| `/api/auth/[...nextauth]` | Handlers do NextAuth (login por credenciais, sessão JWT) |

## Server Actions (`src/app/_actions`)
| Action | Quem | Entrada | Retorno |
|--------|------|---------|---------|
| `pagarFlecas` | logado | `quantidade` (1–1000) | `{ erro, registroId, conquistas[], resumo[] }` |
| `apagarSerie` | logado (dono) | `registroId` — só de hoje (usada pelo "Desfazer" e pela lixeira) | `{ erro }` |
| `cadastrar` | público | name, email, password (≥6), sexo | `{ erro, id? }` |
| `adminCriarUsuario` | ADMIN | name, email, password, sexo | `{ erro, id? }` |
| `adminAlternarAtivo` | ADMIN | userId (o admin nunca pode ser desativado) | `{ erro }` |
| `sair` | logado | — | redireciona para `/login` |

`pagarFlecas` também devolve `{ erro, esperarSegundos }` quando uma trava barra o registro (ver `knowledge/domain.md`).

`conquistas[]`: `{ tipo, periodo, valor, nivel, nova }` — `nova=false` quando só ampliou um recorde já batido no período.
