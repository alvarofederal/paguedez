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

## Social (`src/app/_actions/social.ts`) — todas exigem sessão e `FEATURE_SOCIAL` ligado; entrada validada com Zod
| Action | Quem | Resultado |
|--------|------|-----------|
| `criarConviteAction` | logado | `{ erro, link, whatsappUrl, mascara, reenviado }` |
| `reenviarConviteAction` / `cancelarConviteAction` | dono do convite | novo link (sem número: o WhatsApp abre a lista de contatos) / cancela |
| `aceitarConviteAction(token, nivel)` | logado (não o convidante) | cria amizade (+ entra no pelotão, se for o caso) |
| `definirVisibilidadeAction`, `desfazerAmizadeAction` | amigo | muda o que EU mostro / desfaz |
| `criarComunidadeAction`, `atualizarComunidadeAction`, `excluirComunidadeAction`, `removerMembroAction` | comandante | gestão do pelotão |
| `sairDaComunidadeAction`, `entrarPorCodigoAction` | membro / logado | sair / entrar pelo link |

### Rotas do social
| Rota | Acesso | Descrição |
|------|--------|-----------|
| `/convidar` | logado | formulário do convite + convites enviados |
| `/convite/[token]` | **pública** | convite aberto pelo amigo (cadastro/login com `?next=` e depois o aceite) |
| `/c/[codigo]` | **pública** | entrada no pelotão pelo link |
| `/tropa`, `/tropa/[userId]` | logado / amigos | ranking de amigos, visibilidade, perfil do amigo |
| `/comunidades`, `/comunidades/[id]`, `/comunidades/[id]/membro/[userId]` | logado / membros | pelotões, ranking, comando, perfil do membro |
| `/emblemas` | logado | emblemas conquistados e bloqueados |

| `convocarAmigoAction(comunidadeId, amigoId)` | membro do pelotão | cria a convocação (pendente) para um amigo |
| `responderConvocacaoAction(id, aceitar)` | o convidado | aceita (entra no pelotão) ou recusa |
