import { configDefaults, defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    globals:     true,
    environment: "node",
    setupFiles:  ["./tests/setup.ts"],
    // Testes de integração usam o banco REAL (com limpeza no final): só rodam com `npm run test:integracao`
    exclude: process.env.TESTES_INTEGRACAO ? configDefaults.exclude : [...configDefaults.exclude, "tests/integration/**"],
    testTimeout: 30_000,       // 30s para consultas DB reais
    hookTimeout: 30_000,
    // Testes de integração compartilham banco real: sem paralelismo entre arquivos
    // para evitar que o afterAll de um arquivo limpe dados de outro worker
    fileParallelism: false,
    sequence: {
      shuffle: false,          // manter ordem determinística nos testes de fluxo
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.d.ts", "src/generated/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
