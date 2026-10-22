# Lembretes por notificação push

> Status: **implementado em 2026-10-22**, gratuito e liberado para todos. O que será pago fica para decidir depois
> (ideia: grátis = 1 lembrete; plano pago = agenda completa). Os limites vivem em `LIMITES_LEMBRETES` (`src/lib/planos.ts`).

## O que o usuário vê
- **`/lembretes`**: "Este aparelho" (ativar, desativar, **enviar notificação de teste**) e "Sua agenda" (até 10 lembretes, cada um com horário, dias da semana,
  interruptor e a opção "só avisar se eu ainda não paguei flecas hoje").
- **Tela Pagar**: card fixo (`src/components/lembretes-card.tsx`) que muda conforme o passo: sem nada configurado ("Lembrete diário"), horários criados sem aparelho ativo ("Falta ativar o aparelho", em vermelho), aparelho ativo sem horários ("Escolha um horário") e tudo certo ("Lembretes ativos", com os horários e o botão "Gerenciar lembretes").
- **Topo de todas as telas**: sino com selo — número de lembretes ativos, ou "!" em vermelho quando há horários mas nenhum aparelho recebe. No celular só o ícone; a partir de `sm` aparece o texto "Lembretes".
- **Landing**: seção "Lembrete no celular", com a ressalva do iPhone.
- **A notificação**: título com o tratamento pela patente e o que fazer ("Cabo, hora de pagar dez!", "Faltam 21 para o recorde"), corpo com o número que importa, selo "10" colorido, imagem grande no estilo do app (azul ou rosa, conforme o tema do usuário), botões **Pagar agora** / **Mais tarde** (Android e desktop; o iPhone mostra só título e texto), vibração e selo monocromático na barra de status do Android. As imagens são geradas em `/icone-pwa/badge`, `/icone-pwa/banner-azul` e `/icone-pwa/banner-rosa` (`src/components/imagens-notificacao.tsx`). Tocar abre o app; "Mais tarde" só fecha. O envio usa urgência alta, para o Android em economia de bateria não segurar o aviso.

## Como funciona (3 peças)
| Peça | O que faz | Como está feito |
|------|-----------|-----------------|
| **Entrega** | Leva a mensagem ao aparelho | **Web Push (VAPID)**, padrão aberto dos navegadores. Gratuito, sem Firebase e sem conta externa. Biblioteca `web-push`. |
| **Agenda** | Guarda quem quer ser avisado e quando | Tabelas `lembretes`, `push_inscricoes` e `lembrete_envios` (MySQL). |
| **Gatilho** | Dispara no horário | `GET /api/lembretes/executar` (protegido por `CRON_SECRET`), chamado por um agendador. |

### O executor (`executarLembretes`, `src/server/lembretes.ts`)
Pode rodar com qualquer frequência. A cada chamada:
1. Pega os lembretes ativos que estão **na janela** do horário (do horário marcado até **120 min** depois, no horário de Brasília — cobre atraso do agendador; nunca manda um lembrete de manhã à noite).
2. Ignora usuário desativado e quem **já pagou flecas hoje** (se o lembrete estiver com "só se ainda não paguei").
3. **Reserva** o par (lembrete, dia) em `lembrete_envios` (chave única) antes de enviar: o mesmo lembrete nunca sai duas vezes no dia, mesmo com duas execuções simultâneas.
4. Envia para todos os aparelhos do usuário. Inscrição que o serviço de push diz não existir mais (404/410) é apagada.
5. Registra o resultado (`ENVIADO`, `IGNORADO_JA_PAGOU`, `SEM_INSCRICAO`, `FALHOU`). O erro de um usuário não impede os demais.

## Agendador (plano Hobby da Vercel)
**Sem um agendador chamando o executor, nenhum lembrete dispara** — o botão de teste funciona porque manda o push na hora, mas a agenda só é lida quando alguém chama `/api/lembretes/executar`. O cron da Vercel no plano **Hobby roda no máximo 1 vez por dia**, então há duas camadas:
1. **Cron da Vercel** (`vercel.json`): uma chamada por dia às 21:00 UTC (18:00 em Brasília). É a rede de segurança e só cobre lembretes das 18h às 20h.
2. **GitHub Actions** (`.github/workflows/lembretes.yml`): chama o endereço **a cada 5 minutos**, de graça (o repositório é público). Precisa de um passo único: criar o secret **`CRON_SECRET`** em GitHub → Settings → Secrets and variables → Actions, com o mesmo valor da variável da Vercel. Sem o secret o workflow falha com mensagem clara. O GitHub pode atrasar uma execução em alguns minutos nos horários de pico (a janela de 120 min absorve isso) e desliga agendamentos de repositório sem nenhuma atividade por 60 dias.
   - Alternativa equivalente: **cron-job.org** com `GET https://paguedez.vercel.app/api/lembretes/executar`, cabeçalho `Authorization: Bearer <CRON_SECRET>`, a cada 5 minutos.

Para conferir: `curl -H "Authorization: Bearer <CRON_SECRET>" https://paguedez.vercel.app/api/lembretes/executar` devolve o resumo da execução; as execuções ficam em `lembrete_envios`.

## Variáveis de ambiente (Vercel, Production)
`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (sensível), `VAPID_SUBJECT` (mailto:), `CRON_SECRET` (sensível). Sem elas a tela mostra "ainda não configuradas" e o endpoint fica fechado.
Gerar novas chaves: `npx web-push generate-vapid-keys`. **Trocar as chaves invalida todas as inscrições** (cada aparelho precisa ativar de novo).

## Peças no navegador
- `public/sw.js`: service worker (recebe o push, monta a notificação com imagem e botões e abre o app ao tocar). Não faz cache.
- `src/app/manifest.ts` + `/icone-pwa/[tamanho]`: app instalável (necessário no iPhone) com o ícone do selo "10".
- `src/lib/push-cliente.ts`: detecção de suporte, permissão, inscrição.

## Limites e cuidados
- **iPhone/iPad**: o push só existe com o site instalado na Tela de Início (iOS 16.4+). A tela explica o passo a passo.
- A permissão é pedida só depois de um toque do usuário. Se ele bloquear no navegador, a tela explica como liberar.
- Cada navegador/computador precisa ser ativado separadamente.
- Notificação em excesso faz o usuário bloquear o app e o canal se perde: teto de 10 lembretes por usuário; `tag` única substitui a notificação anterior em vez de empilhar; TTL de 1 hora.
- Excluir um perfil apaga também a agenda e os aparelhos dele.

## Ideias para depois
Lembrete insistente (repete até pagar), avisos do pelotão ("fulano passou você"), mensagens personalizadas, resumo semanal, e Firebase (FCM) só se um dia houver app nativo.
