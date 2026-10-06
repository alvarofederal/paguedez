import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const ROTAS_PUBLICAS = ["/login", "/cadastro"]

// Checagem leve só pelo cookie (sem Prisma no edge).
// A validação real da sessão acontece no layout de cada área protegida.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // "/" é pública: visitante vê a landing, usuário logado vê o app (decidido na própria página)
  if (pathname === "/" || ROTAS_PUBLICAS.some((rota) => pathname.startsWith(rota))) {
    return NextResponse.next()
  }

  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value

  if (!sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
