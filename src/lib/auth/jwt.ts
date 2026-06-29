import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gablimados-secret-fallback'
)

export interface JWTPayload {
  sub: string
  nombre: string
  email: string
  rol: string
  iat?: number
  exp?: number
}

// ─── Crear token JWT ──────────────────────────────────────────────────────────
export async function crearToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

// ─── Verificar token JWT ──────────────────────────────────────────────────────
export async function verificarToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

// ─── Obtener sesión actual ────────────────────────────────────────────────────
export async function obtenerSesion(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('gab_session')?.value
  if (!token) return null
  return verificarToken(token)
}

// ─── Verificar si está autenticado ───────────────────────────────────────────
export async function estaAutenticado(): Promise<boolean> {
  const sesion = await obtenerSesion()
  return sesion !== null
}
