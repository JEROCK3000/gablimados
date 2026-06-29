import type { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { obtenerSesion } from '@/lib/auth/jwt'
import { redirect } from 'next/navigation'
import { VentasClient } from './VentasClient'
import { format } from 'date-fns'

export const metadata: Metadata = {
  title: 'Ventas Directas — GABLIMADOS',
}

export default async function VentasPage() {
  const sesion = await obtenerSesion()
  if (!sesion) redirect('/login')

  // Fetch sales, clients, products, and emisor info
  const [pedidos, clientes, productos, emisor] = await Promise.all([
    prisma.pedido.findMany({
      where: { estado: 'VENTA' },
      include: {
        cliente: true,
        facturaSRI: true,
        items: {
          include: { producto: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.cliente.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, identificacion: true },
      orderBy: { nombre: 'asc' }
    }),
    prisma.producto.findMany({
      select: { id: true, nombre: true, precioSugerido: true },
      orderBy: { nombre: 'asc' }
    }),
    prisma.emisorSRI.findFirst()
  ])

  // Format products list
  const formattedProductos = productos.map(p => ({
    id: p.id,
    nombre: p.nombre,
    precio: Number(p.precioSugerido)
  }))

  // Format emisor
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

  // Format sales
  const formattedVentas = pedidos.map(p => ({
    id: p.id,
    numero: p.numero,
    estado: p.estado,
    subtotal: Number(p.subtotal),
    iva: Number(p.iva),
    descuento: Number(p.descuento),
    total: Number(p.total),
    formaPago: p.formaPago,
    fecha: format(p.createdAt, 'dd/MM/yyyy'),
    notas: p.notas,
    clienteId: p.clienteId,
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
      xmlFirmado: p.facturaSRI.xmlFirmado,
      mensajeError: p.facturaSRI.mensajeError
    } : null
  }))

  return (
    <VentasClient 
      ventas={formattedVentas} 
      clientes={clientes} 
      productos={formattedProductos} 
      emisor={formattedEmisor} 
    />
  )
}
