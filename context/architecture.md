# Arquitetura — Pague Dez

Camadas simples, dependências apontando para dentro (domínio puro no centro):

```
src/
├── lib/                    # DOMÍNIO e infraestrutura compartilhada
│   ├── periodos.ts         # puro: dia de Brasília, semana ISO, chaves de período, rótulos
│   ├── recordes.ts         # puro: totais por período, avaliação de recorde, resumo
│   ├── tacas.ts            # puro: categoria (Bronze→Lendária) e escala da taça
│   ├── validators.ts       # schemas Zod
│   ├── auth.ts             # NextAuth (JWT) + usuarioAtual()
│   └── prisma.ts           # cliente Prisma singleton
├── server/                 # CASOS DE USO com banco ("server-only")
│   ├── flexoes.ts          # registrarSerie, excluirSerie, painelDoDia, historico
│   └── usuarios.ts         # criarUsuario, listarUsuarios
├── app/
│   ├── _actions/           # Server Actions: autenticação + Zod + chamam src/server
│   ├── _components/        # componentes da tela inicial
│   ├── page.tsx            # / — PAGUEI!
│   ├── historico/          # /historico
│   ├── admin/usuarios/     # /admin/usuarios
│   ├── login/, cadastro/   # acesso público
│   └── api/auth/[...nextauth]/route.ts
├── components/             # UI compartilhada (AppShell, Taca, Celebracao, Placar...)
└── generated/prisma        # cliente gerado (não versionado)
tests/unit/                 # testes das funções puras
middleware.ts               # redireciona para /login sem cookie de sessão
```

## Fluxo do botão PAGUEI!
1. `PagarForm` (client) chama a action `pagarFlecas(quantidade)`.
2. A action valida sessão + Zod e chama `registrarSerie()`.
3. Em uma transação: cria o `Registro`, concede a taça "Recruta" se for o 1º registro,
   recalcula totais por dia, `avaliarRecordes()` e sincroniza as taças do período atual.
4. Retorna `conquistas` + `resumo`. Conquistas novas abrem a `Celebracao` (confetes + taça).

## Proteção de rotas
- `middleware.ts` só verifica o cookie (edge, sem banco).
- Cada página chama `usuarioAtual()`, que confere no banco se o usuário existe e está ativo.
