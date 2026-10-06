# Melhorias técnicas — Pague Dez

- **Totais por dia em memória**: `registrarSerie` agrupa todos os dias do usuário a cada registro. Ótimo para anos de uso
  individual; se ficar lento, guardar totais agregados por período.
- **Sessão JWT guarda o sexo do login**: o tema da tela usa o valor do token. Quando houver edição de perfil,
  atualizar o token (`unstable_update`) ou ler o sexo do banco no layout.
- **`middleware.ts` → `proxy.ts`**: o Next 16 renomeou a convenção; migrar quando conveniente.
- **Testes de integração**: cobrir `registrarSerie`/`excluirSerie` contra um banco de teste.
