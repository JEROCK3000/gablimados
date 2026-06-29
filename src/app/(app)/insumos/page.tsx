import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { obtenerSesion } from '@/lib/auth/jwt'
import { redirect } from 'next/navigation'
import { InsumosClient } from './InsumosClient'

export const metadata: Metadata = {
  title: 'Insumos e Inventario — GABLIMADOS',
}

export default async function InsumosPage() {
  const sesion = await obtenerSesion()
  if (!sesion) redirect('/login')

  const insumos = await prisma.insumo.findMany({
    where: { activo: true },
    orderBy: { updatedAt: 'desc' }
  })

  // Convert Decimal fields to Number for the Client Component
  const insumosProps = insumos.map(i => ({
    ...i,
    costoTotal: Number(i.costoTotal),
    costoUnitario: Number(i.costoUnitario)
  }))

  return <InsumosClient insumos={insumosProps} />
}
