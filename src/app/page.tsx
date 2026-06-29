import { redirect } from 'next/navigation'
import { estaAutenticado } from '@/lib/auth/jwt'

export default async function Home() {
  const autenticado = await estaAutenticado()
  if (autenticado) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
