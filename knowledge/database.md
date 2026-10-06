# Banco de dados — Pague Dez

MySQL via Prisma 5 (`relationMode = "prisma"`). Schema completo em `prisma/schema.prisma`.

## Tabelas
| Tabela | Modelo | Campos principais |
|--------|--------|-------------------|
| `users` | `User` | name, email (único), password (bcrypt), sexo, papel, ativo |
| `registros` | `Registro` | userId, quantidade, dia (`YYYY-MM-DD` Brasília), feitoEm |
| `tacas` | `Taca` | userId, tipo, periodo, valor, nivel — único por (userId, tipo, periodo) |

## Enums
- `Papel`: `ADMIN`, `USUARIO`
- `Sexo`: `MASCULINO`, `FEMININO`
- `TipoTaca`: `PRIMEIRA`, `DIARIO`, `SEMANAL`, `MENSAL`, `ANUAL`

## Formato de `Taca.periodo`
| Tipo | Exemplo |
|------|---------|
| PRIMEIRA / DIARIO | `2026-10-06` |
| SEMANAL | `2026-W41` |
| MENSAL | `2026-10` |
| ANUAL | `2026` |

## Consultas comuns
- Totais por dia: `registro.groupBy({ by: ["dia"], where: { userId }, _sum: { quantidade: true } })`
- Taças do usuário: `taca.findMany({ where: { userId }, orderBy: { nivel: "desc" } })`

## Atualização do schema
O build da Vercel roda `prisma db push` (sem `--accept-data-loss`): mudanças destrutivas fazem o build falhar
de propósito. Rode-as manualmente com cuidado, após confirmar.
