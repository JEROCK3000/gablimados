import type { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { obtenerSesion } from '@/lib/auth/jwt'
import { redirect } from 'next/navigation'
import { ShoppingCart } from 'lucide-react'
import { KanbanBoard } from './KanbanBoard'

export const metadata: Metadata = {
  title: 'Pedidos — GABLIMADOS',
}

import { format } from 'date-fns'

export default async function PedidosPage() {
  const sesion = await obtenerSesion()
  if (!sesion) redirect('/login')

  const pedidos = await prisma.pedido.findMany({
    include: {
      cliente: true,
      facturaSRI: true,
      items: {
        include: { producto: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const emisor = await prisma.emisorSRI.findFirst()
  const formattedEmisor = emisor ? {
    ruc: emisor.ruc,
    razonSocial: emisor.razonSocial,
    nombreComercial: emisor.nombreComercial ?? '',
    dirMatriz: emisor.dirMatriz,
    dirEstablecimiento: emisor.dirEstablecimiento,
    codigoEstablecimiento: emisor.codigoEstablecimiento,
    codigoPuntoEmision: emisor.codigoPuntoEmision,
    obligadoContabilidad: emisor.obligadoContabilidad,
    ambiente: emisor.ambiente,
    contribuyenteEspecial: emisor.contribuyenteEspecial ?? '',
    agenteRetencion: emisor.agenteRetencion ?? '',
  } : null

  // Format to standard JS objects for Client Component
  const formattedPedidos = pedidos.map(p => ({
    id: p.id,
    numero: p.numero,
    estado: p.estado,
    subtotal: Number(p.subtotal),
    iva: Number(p.iva),
    descuento: Number(p.descuento),
    total: Number(p.total),
    formaPago: p.formaPago,
    fecha: format(p.createdAt, 'dd/MM/yyyy'),
    cliente: {
      nombre: p.cliente.nombre,
      identificacion: p.cliente.identificacion,
      direccion: p.cliente.direccion,
      email: p.cliente.email
    },
    itemsCount: p.items.reduce((acc, item) => acc + item.cantidad, 0),
    items: p.items.map(i => ({
      productoId: i.productoId,
      cantidad: i.cantidad,
      precioUnitario: Number(i.precioUnitario),
      subtotal: Number(i.subtotal),
      producto: {
        nombre: i.producto.nombre
      }
    })),
    facturaSRI: p.facturaSRI ? {
      estado: p.facturaSRI.estado,
      claveAcceso: p.facturaSRI.claveAcceso,
      numeroAutorizacion: p.facturaSRI.numeroAutorizacion,
      fechaAutorizacion: p.facturaSRI.fechaAutorizacion ? p.facturaSRI.fechaAutorizacion.toISOString() : null,
      xmlFirmado: p.facturaSRI.xmlFirmado
    } : null
  }))

  return (
    <div className="space-y-6 h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="text-purpura-500" />
            Pedidos y Cotizaciones
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Mueve las tarjetas para cambiar su estado
          </p>
        </div>
      </div>

      <KanbanBoard pedidos={formattedPedidos} emisor={formattedEmisor} />
    </div>
  )
}
