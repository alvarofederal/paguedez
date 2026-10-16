import { exigirUsuarioSocial } from "@/server/social"
import { AppShell } from "@/components/app-shell"
import { listarConvites } from "@/server/convites"
import { listarMinhasComunidades } from "@/server/comunidades"
import { ConvidarForm } from "./_components/convidar-form"
import { ListaConvites } from "./_components/lista-convites"

export const dynamic = "force-dynamic"
export const metadata = { title: "Mandar pagar dez" }

export default async function ConvidarPage({ searchParams }: { searchParams: Promise<{ comunidade?: string }> }) {
  const usuario = await exigirUsuarioSocial()
  const { comunidade } = await searchParams

  const [convites, pelotoes] = await Promise.all([listarConvites(usuario.id), listarMinhasComunidades(usuario.id)])
  const inicial = pelotoes.some((p) => p.id === comunidade) ? comunidade : undefined

  return (
    <AppShell usuario={usuario}>
      <h1 className="display mt-2 mb-2 text-[44px] sm:text-[52px]">
        Mandar
        <br />
        pagar dez
      </h1>
      <p className="mb-6 font-medium">
        Escolha um amigo, informe o WhatsApp e o app abre a conversa com a mensagem e o seu link. É só apertar enviar!
      </p>

      <ConvidarForm
        meuNome={usuario.name}
        pelotoes={pelotoes.map((p) => ({ id: p.id, nome: p.nome }))}
        pelotaoInicial={inicial}
      />

      <section className="mt-10">
        <h2 className="rotulo mb-3">Meus convites ({convites.length})</h2>
        <ListaConvites convites={convites.map((c) => ({ ...c, criadoEm: c.criadoEm.toISOString(), expiraEm: c.expiraEm.toISOString() }))} />
      </section>
    </AppShell>
  )
}
