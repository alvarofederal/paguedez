/**
 * tests/setup.ts
 * Setup global para todos os testes: carrega variáveis de ambiente.
 */
import { config } from "dotenv"
import path from "path"

config({ path: path.resolve(process.cwd(), ".env") })
config({ path: path.resolve(process.cwd(), ".env.local"), override: true })
