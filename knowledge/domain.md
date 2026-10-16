# Domínio — Pague Dez

## Vocabulário
| Termo | Significado |
|-------|-------------|
| Fleca | Flexão de braço no chão |
| Pagar dez | Fazer 10 flexões (a ordem do sargento) |
| Série / Registro | Um clique no PAGUEI! com a quantidade feita |
| Período | Dia, semana ISO (seg–dom), mês ou ano — sempre no horário de Brasília |
| Recorde | Maior total somado em um período |
| Taça | Troféu concedido ao bater um recorde |

## Regras de recorde (`src/lib/recordes.ts`)
1. O total de um período é a **soma** de todas as séries nele.
2. Há recorde quando o total do período atual é **estritamente maior** que o melhor período anterior do mesmo tipo.
3. Sem período anterior (ex.: primeira semana de uso) não há recorde daquele tipo.
4. Um único registro pode bater vários recordes ao mesmo tempo (dia + semana + mês...).

## Regras de taça (`src/lib/tacas.ts`, `src/server/flexoes.ts`)
1. **Primeiro registro da vida** → taça `PRIMEIRA` ("Recruta").
2. Bateu recorde em um período pela primeira vez → **nova taça** (com confetes).
3. Aumentou ainda mais no mesmo período → a taça existente tem o **valor atualizado** (aviso simples, sem nova taça).
4. `nivel` = número sequencial da conquista do usuário. Define:
   - **tamanho**: `escalaTaca(nivel)` cresce 6% por nível (máx. 2×);
   - **categoria**: pontos = nível + bônus do tipo (semanal +3, mensal +6, anual +10) →
     Bronze (0), Prata (3), Ouro (7), Platina (12), Diamante (18), Lendária (26).
   - Ouro+ ganha estrela; Diamante+ ganha joias; Lendária ganha coroa.

## Travas anti-sacanagem (`src/lib/limites.ts`)
Aplicadas **no servidor**, dentro da transação de `registrarSerie` (com `SELECT ... FOR UPDATE` na linha do usuário, para que
cliques simultâneos entrem um de cada vez). Os números ficam todos em `LIMITES` — é o único lugar para ajustar.

| Regra | Valor |
|-------|-------|
| Intervalo mínimo entre registros | 15 s |
| Máx. de registros na janela deslizante | 2 a cada 3 min |
| Teto de uma série | 200 (acima de 100 o app pergunta "foram mesmo N?") |
| Teto diário | 20 registros e 1000 flecas |

O botão mostra contagem regressiva ("descansando"); o servidor devolve `esperarSegundos`. O admin vê "⚠ Série suspeita" em quem
já registrou série acima de 100.

## Exclusão de série ("o guerreiro errou")
- Só séries **de hoje**. Três caminhos: botão **Desfazer** no aviso (8s) após registrar, link **"Errei o número, desfazer"** na tela de comemoração, e a lixeira em "Séries de hoje".
- Após excluir, as taças do período atual são recalculadas: se deixou de ser recorde, a taça é removida.

## Social: convites, amigos, pelotões e emblemas (regras puras em `src/lib/*`, casos de uso em `src/server/*`)
- **Convite**: link `/convite/<token>`; token aleatório de 128 bits, só o SHA-256 fica no banco. Validade de 7 dias, uso único por aceitante.
  Telefone = HMAC-SHA256 (segredo `CONVITE_SECRET` ou `AUTH_SECRET`) + máscara. Mesmo amigo + mesmo pelotão pendente = **reenvio** (não gasta cota).
  O link do WhatsApp (`wa.me`) é aberto pelo navegador do usuário; o app não envia mensagens.
  A mensagem final é **mensagem + link na linha de baixo** (`textoFinal`); o campo "Mensagem" passa a mostrá-la com o link e há o botão
  "Copiar mensagem". Um link de convite antigo no fim do texto é removido antes de colocar o novo (`removerLinkDeConvite`).
- **Cotas** (`src/lib/planos.ts`): máx. 5 pendentes, 10 convites/24h, 5 pelotões por comandante, 100 membros por pelotão — sempre valem.
  O limite de **amigos por plano** (3 no grátis) só vale com `COBRANCA_ATIVA=true`; hoje é ilimitado.
- **Visibilidade** (0 só ranking · 1 + recordes e taças · 2 + séries de hoje e gráfico): entre amigos cada lado define o que mostra;
  no pelotão **só o comandante define**, para todos. Os dados só são buscados se o nível permitir.
- **Amizade** nasce do aceite do convite (par ordenado, única). Aceitar um convite de pelotão também entra no pelotão.
- **Ranking** (`rankingDe`): soma de flecas do período (dia/semana ISO/mês/ano, horário de Brasília); desempate por quem completou primeiro;
  conta desativada some. Somente leitura sobre `registros`.
- **Privacidade das páginas**: perfil de amigo só para amigos conectados; pelotão só para membros (para os demais é 404).
- **Emblemas** (`src/lib/emblemas.ts`): regras puras; sincronizados ao abrir `/emblemas` e ao aceitar convite/criar pelotão (melhor esforço).
  Recrutador = 1º convite aceito. Para criar outro: catálogo + `enum TipoEmblema`.

### Convocar um amigo que já está no app para o pelotão
- Quem é do pelotão chama um **amigo conectado** (`convocarAmigo`); ninguém é colocado à força: entrar significa mostrar dados no nível que o
  comandante definiu, então o amigo vê **o que será visível** e **aceita ou recusa** em `/comunidades` (aviso também em `/tropa`).
- Só amigos podem ser chamados; quem **recusou** não é incomodado de novo; quem aceitou e depois saiu pode ser chamado outra vez; excluir o pelotão apaga as convocações.
- O item **Pelotão** do menu só aparece depois que o usuário é de algum pelotão (um só: vai direto a ele; vários: lista). Criar/entrar continua em **Tropa**.

## Patentes (regras completas em `planning/patentes.md`; números em `src/lib/patentes.ts`)
- 10 patentes: Recruta, Soldado, Cabo, Sargento, Tenente, Capitão, Major, Coronel, General, Comandante.
- A patente é **calculada** a partir dos registros (`sincronizarPatente`) e guardada; só sobe, nunca desce.
- Requisitos por patente: **flecas válidas** (teto de 300 por dia), **dias pagos** (≥ 10 flecas no dia) e, de Sargento em diante, **recrutas ativos**
  (amigos que aceitaram o convite e pagaram em 3 dias diferentes). Sem o social ligado, a exigência de recrutas é ignorada.
- A sincronização roda ao abrir a tela Pagar (falha ali não quebra a tela) e `/patentes`; a promoção é comemorada uma única vez (`novas`).
