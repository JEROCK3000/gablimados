import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gablimados-secret-fallback'
)

const RUTAS_PUBLICAS = ['/login', '/api/auth']
const RUTA_LOGIN = '/login'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir rutas públicas
  const esPublica = RUTAS_PUBLICAS.some(ruta => pathname.startsWith(ruta))
  if (esPublica) return NextResponse.next()

  // Verificar token
  const token = request.cookies.get('gab_session')?.value

  if (!token) {
    return NextResponse.redirect(new URL(RUTA_LOGIN, request.url))
  }

  try {
    await jwtVerify(token, JWT_SECRET)
    return NextResponse.next()
  } catch {
    const response = NextResponse.redirect(new URL(RUTA_LOGIN, request.url))
    response.cookies.delete('gab_session')
    return response
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logos|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
