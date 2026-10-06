# Pague Dez — Visão do Produto

> "Pague dez!" — a ordem do sargento que todo milico e ex-milico conhece.
> App para registrar flexões de braço ("flecas"), bater recordes e comemorar cada evolução.

## 1. Objetivo

Criar o hábito diário de exercício começando pelo mais simples possível: **registrar flexões**.
Uso diário em segundos: abrir → digitar o número → apertar o botão → (talvez) comemorar um recorde.
Crescer depois para outros exercícios, sempre com o "pagar dez" como carro-chefe e gancho viral.

## 2. Atores

| Ator | O que faz |
|------|-----------|
| **Admin** | Cadastra e gerencia usuários (ativar/desativar, ver lista). |
| **Pagador de Flecas** | Registra séries de flexões, vê recordes, taças, histórico e gráfico. |

Autenticação reaproveitada do projetobase (NextAuth + credenciais). Observação: hoje o base usa
sessão `strategy: "database"`; se a ideia é JWT puro, trocar para `strategy: "jwt"` (decisão a confirmar).

## 3. Funcionalidades do MVP

### 3.1 Registrar flexões (tela principal)
- Campo numérico grande: "Quantas flecas você pagou?" (inteiro, 1–1000).
- **Botão grande centralizado** abaixo do campo: **"PAGUEI!"**.
- Cada clique gera **um registro (série)** com data/hora. Várias séries no mesmo dia se somam.
- Mostra logo abaixo: total de hoje, da semana, do mês e do ano.

### 3.2 Recordes
Recorde = **maior total somado no período** (não a maior série isolada):

| Tipo | Compara |
|------|---------|
| Diário | total de hoje × maior total diário anterior |
| Semanal | total da semana (seg–dom) × melhor semana anterior |
| Mensal | total do mês × melhor mês anterior |
| Anual | total do ano × melhor ano anterior |

- Verificação feita no **servidor** a cada registro; retorna quais recordes foram batidos.
- O primeiro registro de todos não conta como recorde (não há o que bater) — ou conta como "Recruta", a decidir.
- Um mesmo clique pode bater vários recordes de uma vez → comemoração mostra todos.

### 3.3 Comemoração
- Explosão de **confetes** na tela (estilo campeão) + mensagem "NOVO RECORDE DIÁRIO: 47 flecas!".
- Aparece uma **taça**. Cada nova taça é **maior e mais bonita** que a anterior:
  níveis progressivos (ex.: Bronze → Prata → Ouro → Platina → Diamante → Lendária), tamanho
  e brilho aumentando conforme o número da conquista.
- Recordes semanal/mensal/anual têm taça de categoria mais nobre que o diário.

### 3.4 Histórico
- **Galeria de taças** (todas as conquistadas, com data e valor).
- **Recordes atuais** de cada tipo (dia/semana/mês/ano) com o número de flexões.
- Lista das séries registradas (com opção de apagar um lançamento errado).

### 3.5 Gráfico de desempenho
- Gráfico simples de barras: total de flexões por dia (últimos 30 dias), com linha do recorde diário.

### 3.6 Tema por gênero
- Cadastro tem campo **sexo** (Masculino/Feminino).
- Masculino → fundo predominantemente **azul**; Feminino → predominantemente **rosa**.
- Implementado com tokens de cor (CSS variables) trocados por um atributo no `<html>`; a identidade
  visual oficial será aplicada sobre esses tokens quando for enviada.

## 4. Modelo de dados (proposta — confirmar antes de alterar o schema)

```
User        + sexo (MASCULINO | FEMININO)
Registro    id, userId, quantidade, feitoEm (DateTime), criadoEm
Recorde     id, userId, tipo (DIARIO|SEMANAL|MENSAL|ANUAL), valor, periodo ("2026-10-06", "2026-W41", "2026-10", "2026"), batidoEm
Taca        id, userId, recordeId, nivel (Int, cresce a cada conquista), tipo, valor, conquistadaEm
```

Datas calculadas no fuso **America/Sao_Paulo** (senão o "dia" vira à meia-noite UTC = 21h).

## 5. Fora do MVP (próximas ideias)

- Outros exercícios (abdominal, barra, agachamento, prancha).
- **Desafio "Pague Dez"**: o usuário "manda" um amigo pagar dez via link de WhatsApp — principal motor de viralização.
- Ranking entre amigos / pelotão (grupos), patentes por volume acumulado (Recruta → Soldado → Cabo → Sargento → … → General).
- Lembrete diário (notificação PWA) e sequência de dias seguidos ("ofensiva").
- Card compartilhável da taça para Instagram/WhatsApp.

## 6. Ideias de monetização

- **Freemium**: flexões grátis; plano "Oficial" libera todos os exercícios, estatísticas avançadas e temas.
- **Pelotões pagos** para academias, TAFs, cursinhos preparatórios militares e assessorias (desafios internos com ranking).
- **Planos de treino para TAF** (PM, PRF, PF, Exército, Bombeiros) — público grande e disposto a pagar.
- Taças/molduras cosméticas e parcerias com marcas de suplemento/roupa tática.
