# Convites e Comunidade de Pagação — Descritivo

> Status: **proposta para aprovação** (2026-10-16). Nada disto foi implementado.
> Origem: ideia do dono do produto — "mandar um amigo pagar dez" pelo WhatsApp, limite de convites grátis,
> comunidades e ranking entre amigos. O que é pago e o que é grátis será definido **depois** de tudo pronto.

## 1. Resumo em uma frase

O usuário logado aperta **"Mandar pagar dez"**, informa o WhatsApp de um amigo, e o app abre o WhatsApp com uma mensagem
pronta e um **link único**. O amigo abre o link, cria a conta, e os dois passam a se enxergar num **ranking de amigos**.
Quem quiser pode ainda montar uma **Comunidade de Pagação** (um pelotão) com ranking próprio.

## 2. Princípio de ouro: não mexer no que já funciona

Tudo é **aditivo**:
- **Tabelas novas** no banco; nenhuma coluna das tabelas `users`, `registros` e `tacas` é alterada ou removida.
- **Rotas e telas novas**; as telas atuais (`/`, `/historico`, `/admin`) só ganham um botão/atalho novo.
- O ranking **lê** os registros que já existem (somente leitura). O fluxo do botão PAGUEI!, recordes, taças e travas anti-sacanagem
  **não muda**.
- Tudo atrás de uma chave `FEATURE_SOCIAL` (variável de ambiente). Desligada = o app é idêntico ao de hoje.
- Cobrança também atrás de chave (`COBRANCA_ATIVA`): desenvolvemos tudo liberado e ligamos o pago quando decidirmos.

## 3. Fluxo do convite (1 amigo)

```
Usuário logado ──► [Mandar pagar dez] ──► /convidar
   │  apelido do amigo + WhatsApp (DDD + número) + mensagem (editável)
   ▼
 Servidor valida (limites, telefone, anti-spam) e cria o convite
   ▼
 App abre  https://wa.me/55DDDNUMERO?text=<mensagem com o link>   (WhatsApp do próprio usuário)
   ▼
 Amigo toca no link  ──►  /convite/<token>
   │  "O Cabo Álvaro mandou você pagar dez!"   [Criar conta e pagar]
   ▼
 Cadastro normal (nome, email, senha, sexo) ──► amizade criada ──► cai direto no PAGUEI!
```

**Importante — como o WhatsApp funciona:** o app **não envia** a mensagem sozinho (isso exigiria a API paga do WhatsApp Business).
Ele abre a conversa já escrita (`wa.me`) e o usuário só aperta enviar. Zero custo, e a mensagem sai do número pessoal do usuário,
o que é mais confiável e menos spam.

### 3.1 O "hash" do convite

A ideia de gerar um hash a partir de *usuário + telefone* tem um problema: número de telefone tem poucas combinações, então
quem tiver o hash consegue **adivinhar o número** por força bruta (e também forjar links). Proposta:

| O quê | Como |
|-------|------|
| **Link** | `token` **aleatório** de 128 bits (`crypto.randomBytes(16)`, base64url). Não adivinhável. |
| **No banco** | só o **SHA-256 do token** (se o banco vazar, os links não funcionam). |
| **Telefone** | guardado como **HMAC-SHA256 com segredo do servidor** (serve para barrar convite duplicado/spam) + **máscara** só para exibir: `(11) 9****-1234`. O número inteiro **não** fica salvo. |
| **Validade** | 7 dias, uso único. "Reenviar" gera token novo e invalida o antigo. |
| **Vínculo** | o token pertence a `convidante + telefone(HMAC)`, que é exatamente o que você pediu: o convite é daquele usuário para aquele número. |

> O amigo **não precisa** se cadastrar com o mesmo número (nem pedimos telefone no cadastro). O link é a prova do convite.

### 3.2 Regras de cota (3 amigos grátis, depois R$ 10/mês)

| Regra | Valor inicial | Observação |
|-------|---------------|-----------|
| Amigos conectados no plano grátis | **3** | conta **amigos que aceitaram**, não links enviados |
| Convites pendentes ao mesmo tempo | 5 | evita queimar vaga com link ignorado |
| Convite expira | 7 dias | libera a vaga pendente |
| Convites criados por dia | 10 | anti-spam |
| Plano pago ("Oficial", R$ 10/mês) | amigos ilimitados* | *valores finais a definir |

Todos esses números ficam num único arquivo (`src/lib/planos.ts`, no mesmo estilo de `src/lib/limites.ts`), então mudar
"3 amigos" para "5" ou trocar o preço é editar uma linha.

### 3.3 Casos de borda

- **Amigo já tem conta:** ao abrir o link logado, aparece "Aceitar convite do Cabo Álvaro?" e a amizade é criada sem novo cadastro.
  Deslogado, vai para o login e volta ao convite.
- **Convidar a si mesmo / amigo já conectado / telefone já convidado:** mensagem clara, não gasta vaga.
- **Link expirado ou já usado:** tela amigável com botão "Criar conta mesmo assim" (a pessoa não é perdida).
- **Convidante desativado:** link vira "convite indisponível".
- **Dois usuários convidam o mesmo amigo:** quem ele aceitar primeiro vira amizade; o outro link, quando aberto por usuário logado, também conecta
  (amizade é por par, não por convite).

## 4. Privacidade: quem vê o quê (a flag)

Atividade física é dado pessoal, então a regra é **consentimento claro**. Cada pessoa controla o que **ela mostra** para cada amigo
(e para quem a convidou) em 3 níveis:

| Nível | O amigo enxerga |
|-------|-----------------|
| **0 — Só ranking** (padrão sugerido) | posição e total de flecas no período |
| **1 — Resumo** | + recordes atuais e taças conquistadas |
| **2 — Tudo** | + séries do dia e gráfico dos últimos 30 dias |

- A flag que você pediu — "mostrar ou não minhas atividades para quem me convidou" — é exatamente esse seletor, perguntado
  **no momento em que o amigo aceita o convite** (toggle claro, com explicação), e editável depois em *Meus amigos*.
- A visibilidade é **por amigo e por direção**: o que eu mostro a ele não obriga ele a me mostrar nada.
- Padrão **Só ranking** e não "Tudo": quem entra por convite não se sente exposto, e o ranking (o que dá graça) funciona do mesmo jeito.
- Sempre dá para **desfazer a amizade** ou **bloquear** quem convida.

## 5. Ranking entre amigos

- Quadro com **Hoje / Semana / Mês / Ano**, com a mesma lógica de períodos do app (horário de Brasília).
- Linha por pessoa: posição, nome de guerra, total no período. Líder ganha 👑.
- Frase de motivação: "Faltam **12 flecas** para passar o Cabo Silva".
- **Critério:** soma de flecas dos registros (os mesmos que já passaram nas travas anti-sacanagem). Empate: quem completou o total primeiro.
- Inclui você + amigos conectados. Contas desativadas somem do ranking.
- Quem está no nível 0 aparece só com número; nenhum detalhe das séries vaza.

## 6. Comunidade de Pagação (pelotão)

Um usuário cria uma comunidade e convida gente (por link ou por WhatsApp, usando o **mesmo mecanismo de convite**, com
`comunidadeId` opcional). Cada comunidade tem:

- **Nome** (ex.: "Pelotão da Madrugada"), cor do adesivo e descrição curta;
- **Dono** (cria, convida, expulsa, apaga) e **membros**; opcional: **ajudantes** (podem convidar);
- **Ranking próprio** (Hoje/Semana/Mês/Ano) — mesmas regras da seção 5;
- **Link de entrada** (e QR code) que o dono pode ativar/desativar — ótimo para academia, cursinho, quartel;
- **Flag de visibilidade da comunidade**: por membro, os mesmos níveis 0/1/2 da seção 4 (padrão: só ranking);
- **Meta coletiva** (ideia): "10.000 flecas no mês" com barra de progresso do pelotão inteiro.

Amigos × comunidade: amigos são **1 a 1** (nascem dos convites); comunidade é **grupo**. Um mesmo usuário pode ter os dois.
Limites (quantas comunidades, quantos membros) entram no `planos.ts` e **o que é pago fica para decidir depois**.

## 7. O que é grátis e o que pode ser pago (a definir)

Montamos tudo liberado e decidimos depois, olhando uso real. Candidatos a "pago" só como sugestão:

| Recurso | Grátis (sugestão) | Pago "Oficial" (sugestão) |
|---------|-------------------|---------------------------|
| Amigos conectados | 3 | ilimitados |
| Comunidades que participa | 1 | várias |
| Comunidades que cria | 0 ou 1 pequena | várias, maiores, com QR/ajudantes/meta |
| Ranking | de amigos | + histórico de campeões e estatísticas |

**Pagamento (R$ 10/mês):** ficaria para uma fase própria. Opções para escolher depois: **Pix recorrente** (Mercado Pago/Asaas),
cartão via Stripe ou link de assinatura. A fundação já fica pronta agora: uma tabela de assinatura + função
`limitesDoUsuario(userId)` que o resto do código consulta. Com `COBRANCA_ATIVA=false`, todo mundo tem o plano completo.

## 8. Modelo de dados proposto (somente tabelas novas)

> Rascunho — o schema só será alterado com sua aprovação (o build roda `prisma db push` no banco real).

| Tabela | Campos principais |
|--------|-------------------|
| `convites` | id, convidanteId, comunidadeId?, apelido, telefoneHmac, telefoneMascara, tokenHash, status (PENDENTE/ACEITO/EXPIRADO/CANCELADO), criadoEm, expiraEm, abertoEm?, aceitoEm?, aceitoPorId? |
| `amizades` | id, usuarioAId, usuarioBId (par ordenado, único), origemConviteId?, criadoEm, aVeBNivel, bVeANivel |
| `comunidades` | id, donoId, nome, cor, descricao?, codigoEntrada?, ativa, criadoEm |
| `membros_comunidade` | comunidadeId, userId, papel (DONO/AJUDANTE/MEMBRO), nivelVisibilidade, entrouEm |
| `assinaturas` | userId, plano (GRATIS/OFICIAL), status, vigenteAte, provedor, refExterna |

Nenhuma delas altera `users`, `registros` ou `tacas`.

## 9. Telas e rotas novas

| Rota | O que é |
|------|---------|
| `/convidar` | formulário do convite + lista de convites (pendente/aceito/expirado) + "reenviar" |
| `/convite/[token]` | página pública do convite (primeiro nome de quem convidou + botão de cadastro/aceite) |
| `/amigos` | ranking dos amigos, nível de visibilidade de cada um, desfazer amizade |
| `/comunidades` · `/comunidades/[id]` | lista, criar, ranking do pelotão, membros, link de entrada |
| `/c/[codigo]` | entrada pública na comunidade por link |
| Navegação | botão **"Mandar pagar dez"** no app (cabeçalho da tela inicial) e item **"Amigos"** na barra inferior |

A landing page ganha uma linha: "Chame a tropa — monte seu pelotão".

## 10. Segurança, abuso e LGPD

- **Telefone** só como HMAC + máscara; o número completo é usado apenas no momento de abrir o `wa.me` (no navegador do usuário).
- **Anti-spam:** limite diário de convites, 1 convite por telefone por convidante, conta nova não convida no primeiro dia (ideia).
- **Anti-fraude de recompensa** (se houver): bônus só depois que o convidado pagar flecas em pelo menos 2 dias diferentes.
- **Anti-enumeração:** token aleatório, resposta igual para token inválido/expirado, limite de tentativas por IP na página do convite.
- **Aviso de LGPD:** texto curto na tela de convite ("você está compartilhando o número de um amigo só para abrir o WhatsApp") e botão
  para o convidado **nunca mais receber convites** (bloqueio por HMAC do telefone, quando ele criar conta ou pedir).
- Ranking e visibilidade seguem a seção 4; sem consentimento, só total do período.

## 11. Ideias para melhorar (candidatas — você escolhe)

1. **Cutucar**: botão "Pague dez!" que cutuca o amigo que ainda não pagou hoje (limite 1 por amigo/dia). Cria hábito e retorno ao app.
2. **Mensagens prontas** com humor militar, para o usuário escolher: "Soldado! O sargento mandou você pagar dez. Aceita?" / "Bati recorde. Quero ver você me alcançar."
3. **Duelo semanal 1×1**: "te desafio a pagar mais que eu até domingo", com taça de duelo para o vencedor.
4. **Compartilhar recorde**: depois de bater recorde, botão "Mandar para a tropa" com a taça e o número (junta com o card compartilhável do backlog).
5. **Campeão da semana**: no domingo, o líder do pelotão ganha uma **taça especial de comunidade** (usa o sistema de taças que já existe).
6. **Patente de Recrutador**: Soldado/Cabo/Sargento conforme o número de amigos que entraram e ficaram ativos.
7. **Meta coletiva do pelotão** (ex.: 10.000 flecas no mês) com barra de progresso.
8. **Rankings alternativos** além do total: **dias seguidos** (ofensiva) e **maior série do dia**, para quem treina menos também ter chance de liderar.
9. **QR code da comunidade** para imprimir e colar em academia, quartel ou cursinho.
10. **Avisos**: "Fulano passou você no ranking" (push por PWA numa fase posterior; WhatsApp automático só se um dia valer o custo da API).

## 12. Fases sugeridas (do mais simples ao mais complexo)

| Fase | Entrega | Esforço |
|------|---------|---------|
| **1** | Convite 1:1 por WhatsApp (`/convidar`, `/convite/[token]`), amizade, **flag de visibilidade**, ranking de amigos, cota de 3 | médio |
| **2** | Comunidades: criar, link/QR de entrada, ranking do pelotão, visibilidade por membro | médio/grande |
| **3** | Planos: `planos.ts`, assinatura, escolha do provedor de pagamento (R$ 10/mês), ligar `COBRANCA_ATIVA` | médio |
| **4** | Extras: cutucar, duelo, campeão da semana, mensagens prontas, meta coletiva | pequenos, um a um |

Cada fase vai com **testes** das regras (cota, expiração, visibilidade, ranking, empates) como as que já existem em `tests/unit`,
e fica atrás de `FEATURE_SOCIAL`, para publicar sem risco e ligar quando você quiser.

## 13. Decisões que preciso de você

1. **Padrão de privacidade:** "Só ranking" (recomendado) ou "Tudo"?
2. **O que conta nos 3 grátis:** amigos que aceitaram (recomendado) ou links enviados?
3. **Recompensa por convite:** nenhuma, ou algo leve (ex.: taça/patente "Recrutador", ou +1 vaga quando o amigo fica ativo)?
4. **Endereço público do app** (para montar o link do convite): domínio próprio ou o da Vercel?
5. **Comunidade já na Fase 1** junto com convites, ou só depois dos convites funcionarem?
6. **Quais ideias da seção 11** entram primeiro (sugestão: cutucar e mensagens prontas)?
