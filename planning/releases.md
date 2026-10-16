# Releases — Pague Dez

## v0.3.0 — Patentes (2026-10-16)
- 10 patentes (Recruta a Comandante) com insígnias, card de progresso na tela Pagar, tela de promoção e página `/patentes`
- Regras à prova de clique à toa: dia pago (≥ 10 flecas), teto de 300/dia para patente, dias mínimos, recrutas ativos; patente nunca desce
- Patente ao lado do nome nos rankings de amigos e pelotões

## v0.2.2 — Mensagem com link e card do pelotão (2026-10-16)
- Ao tocar em "Mandar pagar dez no WhatsApp" o link do convite é criado e **colocado dentro da mensagem**; botão **Copiar mensagem (com o link)**
- Reenviar para o mesmo amigo troca o link velho pelo novo (nunca duplica)
- Card **Chamar o Pelotão!** na tela Pagar, abaixo de "Chame a tropa!" (só para quem já tem pelotão)

## v0.2.1 — Convocar amigo para o pelotão (2026-10-16)
- Quem é do pelotão chama um amigo que já está no app; o amigo aceita ou recusa vendo o que será visível
- Item **Pelotão** no menu apenas para quem já tem pelotão; aviso de convocação em Tropa
- Menu compacto (ícones) quando há 4 ou mais itens

## v0.2.0 — Social (2026-10-16)
- Convites por WhatsApp (`/convidar`, `/convite/[token]`), amizades, ranking de amigos (`/tropa`)
- Comunidades de Pagação (`/comunidades`, `/c/[codigo]`), com visibilidade definida pelo comandante
- Emblemas e página `/emblemas` (Recruta, Recrutador, Comandante, Persistente, Centenário)
- Tudo aditivo e atrás de `FEATURE_SOCIAL`; cobrança preparada, porém desligada

## v0.1.0 — MVP (em desenvolvimento)
- Projeto criado a partir do projetobase; todo o domínio Courtesyfy removido
- Autenticação por credenciais com sessão JWT
- Registro de flexões, recordes por período, taças progressivas e comemoração
- Histórico com gráfico de 30 dias
- Administração de usuários (admin único, definido por email)
- Travas anti-abuso no botão PAGUEI! (intervalo, rajada, tetos por série e por dia) com contagem regressiva
- Landing page pública em `/` para visitantes (o que é, como funciona, taças, por que pagar flecas todo dia)
- Botão "Desfazer" após cada registro e na tela de comemoração
- Identidade visual estilo slush.app com tema azul/rosa por sexo
