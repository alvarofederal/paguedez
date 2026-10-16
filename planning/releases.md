# Releases — Pague Dez

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
