import { prisma } from '@/lib/db/prisma'
import { obtenerSesion } from '@/lib/auth/jwt'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, FileText, Calendar, User, CreditCard, ShieldCheck, ShieldAlert, Clock } from 'lucide-react'
import { format } from 'date-fns'

import { FacturaActions } from './FacturaActions'

interface Props {
  params: Promise<{ id: string }>
}

export default async function FacturaDetailPage({ params }: Props) {
  const sesion = await obtenerSesion()
  if (!sesion) redirect('/login')

  const { id } = await params
  const facturaId = parseInt(id, 10)
  if (isNaN(facturaId)) notFound()

  const factura = await prisma.facturaSRI.findUnique({
    where: { id: facturaId },
    include: {
      pedido: {
        include: {
          cliente: true,
          items: {
            include: { producto: true }
          }
        }
      }
    }
  })

  if (!factura) notFound()

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

  const formattedFactura = {
    id: factura.id,
    pedidoId: factura.pedidoId,
    claveAcceso: factura.claveAcceso,
    numeroAutorizacion: factura.numeroAutorizacion,
    estado: factura.estado,
    mensajeError: factura.mensajeError,
    xmlFirmado: factura.xmlFirmado,
    fechaAutorizacion: factura.fechaAutorizacion ? factura.fechaAutorizacion.toISOString() : null,
  }

  const formattedPedido = {
    numero: factura.pedido.numero,
    subtotal: Number(factura.pedido.subtotal),
    iva: Number(factura.pedido.iva),
    descuento: Number(factura.pedido.descuento),
    total: Number(factura.pedido.total),
    formaPago: factura.pedido.formaPago,
    fecha: format(factura.pedido.createdAt, 'dd/MM/yyyy'),
    cliente: {
      nombre: factura.pedido.cliente.nombre,
      identificacion: factura.pedido.cliente.identificacion,
      direccion: factura.pedido.cliente.direccion,
      email: factura.pedido.cliente.email
    },
    items: factura.pedido.items.map(item => ({
      productoId: item.productoId,
      cantidad: item.cantidad,
      precioUnitario: Number(item.precioUnitario),
      subtotal: Number(item.subtotal),
      producto: {
        nombre: item.producto.nombre
      }
    }))
  }

  const isAutorizada = factura.estado === 'AUTORIZADA'
  const isPendiente = factura.estado === 'PENDIENTE'
  const isRechazada = factura.estado === 'RECHAZADA'

  const mapPagoSRI = (code: string) => {
    if (code === '01') return 'Sin utilización del sistema financiero (Efectivo)'
    if (code === '16') return 'Tarjeta de Débito'
    if (code === '19') return 'Tarjeta de Crédito'
    if (code === '20') return 'Otros con utilización del sistema financiero (Transferencias/Cheques)'
    return 'Otros'
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/facturas" className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 border border-white/5 bg-[#0f0f23]/60">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-white">
              Detalle de Comprobante {factura.pedido.numero}
            </h2>
            <p className="text-xs text-gray-400">
              Creado el {format(factura.createdAt, 'dd/MM/yyyy HH:mm')}
            </p>
          </div>
        </div>

        <FacturaActions
          factura={formattedFactura}
          pedido={formattedPedido}
          emisor={formattedEmisor}
        />
      </div>

      {/* Estado del SRI */}
      <div className={`card flex flex-col md:flex-row gap-4 items-start border border-white/5 bg-[#0f0f23]/60 shadow-xl ${
        isAutorizada ? 'border-green-500/20 bg-green-500/5' : 
        isPendiente ? 'border-amber-500/20 bg-amber-500/5' : 'border-red-500/20 bg-red-500/5'
      }`}>
        <div className={`p-3 rounded-2xl flex-shrink-0 ${
          isAutorizada ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
          isPendiente ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {isAutorizada ? <ShieldCheck size={24} /> : isPendiente ? <Clock size={24} className="animate-pulse" /> : <ShieldAlert size={24} />}
        </div>
        <div className="flex-1 space-y-1 min-w-0 w-full">
          <h4 className="font-bold text-white text-sm">
            Estado SRI: <span className={isAutorizada ? 'text-green-400' : isPendiente ? 'text-amber-400' : 'text-red-400'}>{factura.estado}</span>
          </h4>
          <p className="text-xs text-gray-300 font-mono break-all bg-black/30 p-2.5 rounded-lg border border-white/5">
            <span className="text-gray-500 font-bold block text-[10px] uppercase mb-1">Clave de Acceso</span>
            {factura.claveAcceso}
          </p>
          {factura.numeroAutorizacion && (
            <p className="text-xs text-gray-400">
              <span className="font-semibold text-white">Nro. Autorización:</span> {factura.numeroAutorizacion}
            </p>
          )}
          {factura.fechaAutorizacion && (
            <p className="text-xs text-gray-400">
              <span className="font-semibold text-white">Fecha de Autorización:</span> {format(factura.fechaAutorizacion, 'dd/MM/yyyy HH:mm:ss')}
            </p>
          )}
          {factura.mensajeError && (
            <div className="text-xs text-red-400 mt-2 font-medium bg-red-500/10 p-3 rounded-xl border border-red-500/20">
              ❌ Log de Error SRI: {factura.mensajeError}
            </div>
          )}
        </div>
      </div>

      {/* Datos Receptor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card space-y-4 border border-white/5 bg-[#0f0f23]/60">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm border-b border-white/5 pb-2">
            <User size={16} className="text-purpura-400" />
            Datos del Cliente
          </h3>
          <div className="space-y-2 text-xs text-gray-300">
            <p><span className="text-gray-500 font-medium">Nombre:</span> {factura.pedido.cliente.nombre}</p>
            <p><span className="text-gray-500 font-medium">Identificación:</span> {factura.pedido.cliente.identificacion} ({factura.pedido.cliente.tipoIdentificacion})</p>
            <p><span className="text-gray-500 font-medium">Dirección:</span> {factura.pedido.cliente.direccion || 'Sin Dirección'}</p>
            <p><span className="text-gray-500 font-medium">Email:</span> {factura.pedido.cliente.email || 'Sin Correo'}</p>
          </div>
        </div>

        <div className="card space-y-4 border border-white/5 bg-[#0f0f23]/60">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm border-b border-white/5 pb-2">
            <CreditCard size={16} className="text-purpura-400" />
            Método de Pago
          </h3>
          <div className="space-y-2 text-xs text-gray-300">
            <p><span className="text-gray-500 font-medium">Forma de Pago SRI:</span> {mapPagoSRI(factura.pedido.formaPago)}</p>
            <p><span className="text-gray-500 font-medium">Moneda:</span> DÓLAR AMERICANO (USD)</p>
          </div>
        </div>
      </div>

      {/* Ítems */}
      <div className="card p-0 overflow-hidden border border-white/5 bg-[#0f0f23]/60">
        <div className="p-4 border-b border-white/5 bg-[#0e0e1e]/60">
          <h3 className="font-bold text-white text-sm">Ítems Detallados</h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/1 border-b border-white/5 text-gray-400 text-[10px] font-bold uppercase">
              <th className="p-3">Descripción</th>
              <th className="p-3 text-center">Cantidad</th>
              <th className="p-3 text-right">Precio Unitario</th>
              <th className="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs text-gray-300">
            {factura.pedido.items.map(item => (
              <tr key={item.id} className="hover:bg-white/1">
                <td className="p-3 font-semibold text-white">{item.producto.nombre}</td>
                <td className="p-3 text-center font-bold text-white">{item.quantity ?? item.cantidad}</td>
                <td className="p-3 text-right">${Number(item.precioUnitario).toFixed(2)}</td>
                <td className="p-3 text-right font-semibold text-white">${Number(item.subtotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Totales */}
        <div className="p-4 bg-[#0e0e1e]/60 border-t border-white/5 flex justify-end">
          <div className="w-64 space-y-2 text-xs text-gray-400">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-bold text-white">${Number(factura.pedido.subtotal).toFixed(2)}</span>
            </div>
            {Number(factura.pedido.descuento) > 0 && (
              <div className="flex justify-between text-red-400 font-medium">
                <span>Descuento:</span>
                <span>-${Number(factura.pedido.descuento).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>IVA 15%:</span>
              <span className="font-bold text-white">${Number(factura.pedido.iva).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-2 text-sm text-white font-black">
              <span>Total Comprobante:</span>
              <span className="text-verde-400 font-black">${Number(factura.pedido.total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
