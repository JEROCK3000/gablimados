import type { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { obtenerSesion } from '@/lib/auth/jwt'
import { redirect } from 'next/navigation'
import { Users } from 'lucide-react'
import { ClientPageContent } from './ClientPageContent'

export const metadata: Metadata = {
  title: 'Clientes — GABLIMADOS',
}

export default async function ClientesPage() {
  const sesion = await obtenerSesion()
  if (!sesion) redirect('/login')

  const clientes = await prisma.cliente.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="text-purpura-500" />
            Base de Clientes
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Administra tus clientes para cotizaciones y pedidos
          </p>
        </div>
      </div>

      <ClientPageContent clientes={clientes} />
    </div>
  )
}
