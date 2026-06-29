'use server'

import { prisma } from '@/lib/db/prisma'
import { crearToken } from '@/lib/auth/jwt'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { registrarLog } from '@/lib/logs/logger'

// ─── Login ────────────────────────────────────────────────────────────────────
export async function loginAction(
  prevState: { error: string },
  formData: FormData
) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email y contraseña son requeridos' }
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!usuario || !usuario.activo) {
      await registrarLog('WARN', 'AUTH', `Intento de login fallido: ${email}`)
      return { error: 'Credenciales incorrectas' }
    }

    const passwordValido = await bcrypt.compare(password, usuario.password)

    if (!passwordValido) {
      await registrarLog('SECURITY', 'AUTH', `Password incorrecto para: ${email}`)
      return { error: 'Credenciales incorrectas' }
    }

    const token = await crearToken({
      sub: String(usuario.id),
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    })

    const cookieStore = await cookies()
    cookieStore.set('gab_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/',
    })

    await registrarLog('AUDIT', 'AUTH', `Login exitoso: ${email}`)
  } catch (error) {
    await registrarLog('ERROR', 'AUTH', `Error en login: ${error}`)
    return { error: 'Error interno del servidor' }
  }

  redirect('/dashboard')
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('gab_session')
  redirect('/login')
}
