import { redirect } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { usuarioAtual } from "@/lib/auth"
import { LIMITES_LEMBRETES } from "@/lib/planos"
import { listarLembretes } from "@/server/lembretes"
import { chavePublicaVapid, contarInscricoes, pushConfigurado } from "@/server/push"
import { AgendaLembretes } from "./_components/agenda-lembretes"
import { PainelAparelho } from "./_components/painel-aparelho"

export const dynamic = "force-dynamic"
export const metadata = { title: "Lembretes" }

export default async function LembretesPage() {
  const usuario = await usuarioAtual()
  if (!usuario) redirect("/login")

  const [lembretes, aparelhos] = await Promise.all([listarLembretes(usuario.id), contarInscricoes(usuario.id)])

  return (
    <AppShell usuario={usuario}>
      <h1 className="display mt-2 mb-2 text-[48px] sm:text-[52px]">Lembretes</h1>
      <p className="mb-6 font-medium">
        Receba uma notificação no horário que você escolher, mesmo com o app fechado. Se você já pagou suas flecas no dia, o lembrete não é enviado.
      </p>

      <PainelAparelho configurado={pushConfigurado()} chavePublica={chavePublicaVapid()} aparelhosNaConta={aparelhos} />

      <section className="mt-8">
        <h2 className="rotulo mb-1">Sua agenda</h2>
        <p className="mb-3 text-sm font-medium">
          Até {LIMITES_LEMBRETES.porUsuario} lembretes por dia, nos horários e dias da semana que quiser. Horário de Brasília.
        </p>
        <AgendaLembretes
          lembretes={lembretes.map((l) => ({ id: l.id, hora: l.hora, diasSemana: l.diasSemana, somenteSePendente: l.somenteSePendente, ativo: l.ativo }))}
          limite={LIMITES_LEMBRETES.porUsuario}
          semAparelho={aparelhos === 0}
        />
      </section>
    </AppShell>
  )
}
