import type { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { obtenerSesion } from '@/lib/auth/jwt'
import { redirect } from 'next/navigation'
import { FacturasTable } from './FacturasTable'
import { FileText } from 'lucide-react'
import { format } from 'date-fns'

export const metadata: Metadata = {
  title: 'Historial de Facturas — GABLIMADOS',
}

export default async function FacturasPage() {
  const sesion = await obtenerSesion()
  if (!sesion) redirect('/login')

  const facturas = await prisma.facturaSRI.findMany({
    include: {
      pedido: {
        include: {
          cliente: true,
          items: {
            include: { producto: true }
          }
        }
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

  const formattedFacturas = facturas.map(f => ({
    id: f.id,
    pedidoId: f.pedidoId,
    claveAcceso: f.claveAcceso,
    numeroAutorizacion: f.numeroAutorizacion,
    estado: f.estado,
    mensajeError: f.mensajeError,
    xmlFirmado: f.xmlFirmado,
    fechaAutorizacion: f.fechaAutorizacion ? f.fechaAutorizacion.toISOString() : null,
    createdAt: format(f.createdAt, 'dd/MM/yyyy HH:mm'),
    pedido: {
      numero: f.pedido.numero,
      subtotal: Number(f.pedido.subtotal),
      iva: Number(f.pedido.iva),
      descuento: Number(f.pedido.descuento),
      total: Number(f.pedido.total),
      formaPago: f.pedido.formaPago,
      fecha: format(f.pedido.createdAt, 'dd/MM/yyyy'),
      cliente: {
        nombre: f.pedido.cliente.nombre,
        identificacion: f.pedido.cliente.identificacion,
        direccion: f.pedido.cliente.direccion,
        email: f.pedido.cliente.email
      },
      items: f.pedido.items.map(item => ({
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioUnitario: Number(item.precioUnitario),
        subtotal: Number(item.subtotal),
        producto: {
          nombre: item.producto.nombre
        }
      }))
    }
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <FileText className="text-purpura-500" />
          Comprobantes Electrónicos SRI
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Historial y trazabilidad de facturas emitidas ante el SRI
        </p>
      </div>

      <FacturasTable facturas={formattedFacturas} emisor={formattedEmisor} />
    </div>
  )
}
