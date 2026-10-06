import { redirect } from "next/navigation"
import { usuarioAtual } from "@/lib/auth"
import { listarUsuarios } from "@/server/usuarios"
import { AppShell } from "@/components/app-shell"
import { NovoUsuarioForm } from "./_components/novo-usuario-form"
import { AcoesUsuario } from "./_components/acoes-usuario"

export const dynamic = "force-dynamic"
export const metadata = { title: "Usuários" }

export default async function UsuariosPage() {
  const usuario = await usuarioAtual()
  if (!usuario) redirect("/login")
  if (usuario.papel !== "ADMIN") redirect("/")

  const usuarios = await listarUsuarios()

  return (
    <AppShell usuario={usuario}>
      <h1 className="display mt-2 mb-6 text-[64px]">Tropa</h1>

      <NovoUsuarioForm />

      <ul className="mt-6 space-y-3">
        {usuarios.map((u) => (
          <li key={u.id} className={`adesivo p-4 ${u.ativo ? "" : "bg-[var(--nevoa)] opacity-70"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-bold">
                  <span
                    className="inline-block h-3 w-3 shrink-0 rounded-full border border-black"
                    style={{ background: u.sexo === "FEMININO" ? "var(--chiclete)" : "var(--eletrico)" }}
                    aria-label={u.sexo === "FEMININO" ? "Feminino" : "Masculino"}
                  />
                  <span className="truncate">{u.name}</span>
                  {u.papel === "ADMIN" && (
                    <span className="rotulo rounded-full border border-black bg-[var(--sol)] px-2 py-0.5 !text-[10px]">Admin</span>
                  )}
                  {!u.ativo && (
                    <span className="rotulo rounded-full border border-black bg-white px-2 py-0.5 !text-[10px]">Inativo</span>
                  )}
                </p>
                <p className="truncate text-sm text-[var(--texto-3)]">{u.email}</p>
                <p className="mt-1 text-xs font-bold">
                  {u._count.registros} séries · {u._count.tacas} taças
                </p>
              </div>
              {u.papel !== "ADMIN" && <AcoesUsuario userId={u.id} ativo={u.ativo} />}
            </div>
          </li>
        ))}
      </ul>
    </AppShell>
  )
}
