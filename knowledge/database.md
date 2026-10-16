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

## Tabelas do social (adicionadas em 2026-10-16 — somente tabelas novas, sem relações declaradas)
| Tabela | Modelo | Para quê |
|--------|--------|----------|
| `convites` | `Convite` | convidanteId, comunidadeId?, apelido, **telefoneHmac** + **telefoneMascara** (o número inteiro nunca é gravado), **tokenHash** (SHA-256 do token do link), status, expiraEm, abertoEm, aceitoEm, aceitoPorId |
| `amizades` | `Amizade` | par ordenado (usuarioAId < usuarioBId), `aMostra`/`bMostra` = nível que cada lado mostra ao outro |
| `comunidades` | `Comunidade` | donoId, nome, descricao, cor, **nivelVisibilidade** (decidido pelo dono), codigoEntrada (único), entradaAtiva |
| `membros_comunidade` | `MembroComunidade` | PK (comunidadeId, userId), papel DONO/MEMBRO |
| `emblemas` | `Emblema` | PK (userId, tipo), conquistadoEm — emblema ganho nunca é retirado |

Enums: `StatusConvite` (PENDENTE/ACEITO/EXPIRADO/CANCELADO), `PapelComunidade`, `TipoEmblema`.
Com `relationMode = "prisma"` não há chaves estrangeiras: exclusões em cadeia são feitas à mão (ex.: `excluirComunidade`).
Nenhuma coluna de `users`, `registros` ou `tacas` foi alterada.

### Convocações (adicionada em 2026-10-16)
| Tabela | Modelo | Para quê |
|--------|--------|----------|
| `convocacoes` | `Convocacao` | comunidadeId, convidadoId, convidanteId, status (PENDENTE/ACEITA/RECUSADA), único por (comunidadeId, convidadoId). Chama para o pelotão um **amigo que já está no app**; ele precisa aceitar. |
