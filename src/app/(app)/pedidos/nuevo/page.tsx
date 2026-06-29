import type { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { obtenerSesion } from '@/lib/auth/jwt'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PedidoForm } from './PedidoForm'

export const metadata: Metadata = {
  title: 'Nueva Cotización / Pedido — GABLIMADOS',
}

export default async function NuevoPedidoPage() {
  const sesion = await obtenerSesion()
  if (!sesion) redirect('/login')

  const clientes = await prisma.cliente.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' }
  })

  const productos = await prisma.producto.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' }
  })

  const mappedClientes = clientes.map(c => ({ id: c.id, nombre: c.nombre, identificacion: c.identificacion }))
  const mappedProductos = productos.map(p => ({ 
    id: p.id, 
    nombre: p.nombre, 
    precio: Number(p.precioSugerido)
  }))

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link href="/pedidos" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white text-sm mb-4 transition-colors">
          <ArrowLeft size={15} />
          Volver a pedidos
        </Link>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Nueva Cotización 🛒</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Crea una cotización y agrégale productos
        </p>
      </div>

      <PedidoForm clientes={mappedClientes} productos={mappedProductos} />
    </div>
  )
}
