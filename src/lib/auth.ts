import NextAuth, { DefaultSession } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { z } from "zod"
import prisma from "./prisma"

export const runtime = "nodejs"

export type PapelUsuario = "ADMIN" | "USUARIO"
export type SexoUsuario = "MASCULINO" | "FEMININO"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      papel: PapelUsuario
      sexo: SexoUsuario
    } & DefaultSession["user"]
  }

  interface User {
    papel?: PapelUsuario
    sexo?: SexoUsuario
  }
}

const credenciaisSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,

  // Sessão em JWT: nenhum acesso ao banco para validar a sessão a cada requisição.
  session: {
    strategy: "jwt",
    maxAge: 60 * 24 * 60 * 60, // 60 dias — app de uso diário, sem ficar pedindo login
  },

  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const dados = credenciaisSchema.safeParse(credentials)
        if (!dados.success) return null

        const user = await prisma.user.findUnique({ where: { email: dados.data.email } })
        if (!user || !user.ativo) return null

        const senhaOk = await bcrypt.compare(dados.data.password, user.password)
        if (!senhaOk) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          papel: user.papel,
          sexo: user.sexo,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.papel = user.papel
        token.sexo = user.sexo
      }
      return token
    },

    async session({ session, token }) {
      // next-auth/jwt não é resolvível para module augmentation no beta 30; tipamos aqui.
      session.user.id = (token.id as string | undefined) ?? ""
      session.user.papel = (token.papel as PapelUsuario | undefined) ?? "USUARIO"
      session.user.sexo = (token.sexo as SexoUsuario | undefined) ?? "MASCULINO"
      return session
    },
  },

  pages: {
    signIn: "/login",
  },
})

// Dados frescos do banco (papel/sexo/ativo podem mudar depois do login).
// Retorna null se não houver sessão ou se o usuário foi desativado.
export async function usuarioAtual() {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, papel: true, sexo: true, ativo: true },
  })
  if (!user || !user.ativo) return null
  return user
}
