# Lembretes por notificação push

> Status: **implementado em 2026-10-22**, gratuito e liberado para todos. O que será pago fica para decidir depois
> (ideia: grátis = 1 lembrete; plano pago = agenda completa). Os limites vivem em `LIMITES_LEMBRETES` (`src/lib/planos.ts`).

## O que o usuário vê
- **`/lembretes`**: "Este aparelho" (ativar, desativar, **enviar notificação de teste**) e "Sua agenda" (até 10 lembretes, cada um com horário, dias da semana,
  interruptor e a opção "só avisar se eu ainda não paguei flecas hoje").
- **Tela Pagar**: card "Lembrete diário" para quem ainda não tem nenhum; depois, uma linha discreta "N lembretes ativos · gerenciar".
- **Landing**: seção "Lembrete no celular", com a ressalva do iPhone.
- A notificação traz o tratamento pela patente ("Cabo, você ainda não pagou nenhuma fleca hoje...") e abre o app ao ser tocada.

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
O cron da Vercel no plano **Hobby roda no máximo 1 vez por dia**. Por isso há duas camadas:
1. **Cron da Vercel** (`vercel.json`): uma chamada por dia às 21:00 UTC (18:00 em Brasília). É a rede de segurança e já cobre lembretes por volta das 18h.
2. **Agendador externo gratuito** (recomendado, para horários livres): o **cron-job.org** chamando o endereço a cada 5 minutos.
   - URL: `https://paguedez.vercel.app/api/lembretes/executar`
   - Método: `GET`
   - Cabeçalho: `Authorization: Bearer <valor de CRON_SECRET>` (o valor está no `.env` local, linha `CRON_SECRET`)
   - Frequência: a cada 5 minutos

Sem o agendador externo, só lembretes dentro da janela das 18h–20h (horário de Brasília) são atendidos.

## Variáveis de ambiente (Vercel, Production)
`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (sensível), `VAPID_SUBJECT` (mailto:), `CRON_SECRET` (sensível). Sem elas a tela mostra "ainda não configuradas" e o endpoint fica fechado.
Gerar novas chaves: `npx web-push generate-vapid-keys`. **Trocar as chaves invalida todas as inscrições** (cada aparelho precisa ativar de novo).

## Peças no navegador
- `public/sw.js`: service worker (recebe o push e abre o app ao tocar). Não faz cache.
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
