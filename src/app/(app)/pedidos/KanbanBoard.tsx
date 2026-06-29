'use client'

import { useState } from 'react'
import { Plus, Clock, Printer, CheckCircle, Package, FileText, Download, Check, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { actualizarEstadoPedidoAction } from './actions'
import { emitirFacturaSRIAction, obtenerVistaPreviaFactura, enviarFacturaEmailAction } from './sri-actions'
import { generarRidePDF } from '@/lib/reports/ride'
import { toast } from 'sonner'

type Pedido = {
  id: number
  numero: string
  estado: string
  subtotal: number
  iva: number
  descuento: number
  total: number
  formaPago: string
  fecha: string
  cliente: {
    nombre: string
    identificacion: string
    direccion: string | null
    email: string | null
  }
  itemsCount: number
  items: Array<{
    productoId: number
    cantidad: number
    precioUnitario: number
    subtotal: number
    producto: {
      nombre: string
    }
  }>
  facturaSRI?: {
    estado: string
    claveAcceso: string
    numeroAutorizacion: string | null
    fechaAutorizacion: string | null
    xmlFirmado: string | null
    mensajeError?: string | null
  } | null
}

const ESTADOS = [
  { id: 'COTIZACION', label: 'Cotizaciones', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  { id: 'IMPRIMIENDO', label: 'Imprimiendo', icon: Printer, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  { id: 'PLANCHANDO', label: 'Planchando', icon: Package, color: 'text-purpura-500', bg: 'bg-purpura-50 dark:bg-purpura-500/10' },
  { id: 'LISTO', label: 'Listo', icon: CheckCircle, color: 'text-verde-500', bg: 'bg-verde-50 dark:bg-verde-500/10' }
]

export function KanbanBoard({ pedidos: initialPedidos, emisor }: { pedidos: Pedido[], emisor: any }) {
  const router = useRouter()
  const [pedidos, setPedidos] = useState(initialPedidos)
  const [loadingInvoice, setLoadingInvoice] = useState<Record<number, boolean>>({})
  const [previewData, setPreviewData] = useState<any>(null)
  const [loadingPreview, setLoadingPreview] = useState<Record<number, boolean>>({})

  const onDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('pedidoId', id.toString())
  }

  const onDrop = async (e: React.DragEvent, nuevoEstado: string) => {
    e.preventDefault()
    const id = parseInt(e.dataTransfer.getData('pedidoId'))
    if (!id) return

    setPedidos(prev => prev.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p))
    
    try {
      await actualizarEstadoPedidoAction(id, nuevoEstado)
    } catch (err) {
      setPedidos(initialPedidos)
      alert('Error al mover el pedido')
    }
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleEmitirFactura = async (pedidoId: number) => {
    if (!emisor) {
      toast.error('Debes configurar primero los datos de facturación SRI (Firma .p12 y Emisor) en Configuración > Facturación SRI.')
      return
    }

    setLoadingInvoice(prev => ({ ...prev, [pedidoId]: true }))
    const emitPromise = emitirFacturaSRIAction(pedidoId)

    toast.promise(
      emitPromise,
      {
        loading: 'Firmando comprobante XML y conectando con el SRI...',
        success: (res) => {
          router.refresh()
          return `¡Factura autorizada exitosamente! Nº: ${res.numeroAutorizacion}`
        },
        error: (err) => err.message || 'Error al emitir factura al SRI',
      }
    )

    try {
      const res = await emitPromise
      const pedido = pedidos.find(p => p.id === pedidoId)
      if (res && res.success && pedido && pedido.cliente.email) {
        setTimeout(async () => {
          try {
            const facturaDummy = {
              estado: 'AUTORIZADA',
              claveAcceso: res.accessKey,
              numeroAutorizacion: res.numeroAutorizacion
            }
            const doc = await generarRidePDF(pedido, emisor, facturaDummy, false)
            const dataUrl = doc.output('datauristring')
            const base64 = dataUrl.split(',')[1]
            await enviarFacturaEmailAction(pedidoId, base64)
            toast.success(`Factura enviada automáticamente al correo: ${pedido.cliente.email}`)
          } catch (mailErr: any) {
            console.error('Error al enviar correo automático:', mailErr)
            toast.error(`Factura autorizada, pero no se pudo enviar el correo automático: ${mailErr.message}`)
          }
        }, 1500)
      }
    } catch (err) {
      // toast.promise already handles showing the error
    } finally {
      setLoadingInvoice(prev => ({ ...prev, [pedidoId]: false }))
    }
  }

  const handleAbrirVistaPrevia = async (pedidoId: number) => {
    if (!emisor) {
      toast.error('Debes configurar primero los datos de facturación SRI (Firma .p12 y Emisor) en Configuración > Facturación SRI.')
      return
    }
    setLoadingPreview(prev => ({ ...prev, [pedidoId]: true }))
    try {
      const res = await obtenerVistaPreviaFactura(pedidoId)
      if (res.success) {
        setPreviewData({ ...res, pedidoId })
        toast.success('Vista previa cargada con éxito.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al obtener vista previa de factura')
    } finally {
      setLoadingPreview(prev => ({ ...prev, [pedidoId]: false }))
    }
  }

  const downloadXml = (xmlContent: string, filename: string) => {
    const blob = new Blob([xmlContent], { type: 'text/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex-1 overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max h-full">
        {ESTADOS.map(estado => {
          const columnas = pedidos.filter(p => p.estado === estado.id)
          const Icon = estado.icon
          
          return (
            <div 
              key={estado.id} 
              className="w-80 flex flex-col bg-gray-50/50 dark:bg-white/3 rounded-2xl border border-gray-100 dark:border-white/5"
              onDrop={(e) => onDrop(e, estado.id)}
              onDragOver={onDragOver}
            >
              <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${estado.bg} ${estado.color}`}>
                    <Icon size={16} />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{estado.label}</h3>
                </div>
                <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                  {columnas.length}
                </span>
              </div>

              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {columnas.map(pedido => {
                  const facturado = pedido.facturaSRI?.estado === 'AUTORIZADA'
                  const rechazado = pedido.facturaSRI?.estado === 'RECHAZADA'
                  const pendiente = pedido.facturaSRI?.estado === 'PENDIENTE'
                  const loading = loadingInvoice[pedido.id]

                  return (
                    <div
                      key={pedido.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, pedido.id)}
                      className="card p-4 cursor-grab active:cursor-grabbing hover:border-purpura-500/50 transition-all flex flex-col space-y-3"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold text-purpura-500">{pedido.numero}</span>
                          <span className="text-xs font-semibold text-gray-400">
                            {pedido.fecha}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">
                          {pedido.cliente.nombre}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{pedido.itemsCount} ítems</span>
                        <span className="font-black text-verde-600 dark:text-verde-400 text-sm">
                          ${pedido.total.toFixed(2)}
                        </span>
                      </div>

                      {/* SRI Status & Actions */}
                      <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex flex-col gap-2">
                        {facturado ? (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-[11px] font-bold text-verde-600 dark:text-verde-400">
                              <Check size={12} /> Facturado SRI
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => generarRidePDF(pedido, emisor, pedido.facturaSRI)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 hover:text-purpura-500 rounded-md transition-colors"
                                title="Descargar RIDE (PDF)"
                              >
                                <FileText size={15} />
                              </button>
                              {pedido.facturaSRI?.xmlFirmado && (
                                <button
                                  onClick={() => downloadXml(pedido.facturaSRI!.xmlFirmado!, `FACTURA-${pedido.numero}.xml`)}
                                  className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 hover:text-purpura-500 rounded-md transition-colors"
                                  title="Descargar XML"
                                >
                                  <Download size={15} />
                                </button>
                              )}
                            </div>
                          </div>
                        ) : pendiente ? (
                          <div className="flex flex-col gap-2">
                            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500" title={pedido.facturaSRI?.mensajeError || ''}>
                              <Loader2 size={12} className="animate-spin text-amber-500" /> SRI Pendiente
                            </span>
                            <button
                              onClick={() => handleEmitirFactura(pedido.id)}
                              disabled={loading}
                              className="w-full py-1 text-xs font-bold text-amber-600 hover:bg-amber-50 border border-amber-200 rounded-lg dark:hover:bg-amber-500/10 transition-colors flex justify-center items-center gap-1"
                            >
                              {loading ? <Loader2 size={12} className="animate-spin" /> : null}
                              Consultar SRI
                            </button>
                          </div>
                        ) : rechazado ? (
                          <div className="flex flex-col gap-2">
                            <span className="flex items-center gap-1 text-[11px] font-bold text-red-500" title={pedido.facturaSRI?.mensajeError || ''}>
                              <AlertCircle size={12} /> SRI Rechazado
                            </span>
                            <button
                              onClick={() => handleAbrirVistaPrevia(pedido.id)}
                              disabled={loading || loadingPreview[pedido.id]}
                              className="w-full py-1 text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 rounded-lg dark:hover:bg-red-500/10 transition-colors flex justify-center items-center gap-1"
                            >
                              {loading || loadingPreview[pedido.id] ? <Loader2 size={12} className="animate-spin" /> : null}
                              Reintentar Facturar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAbrirVistaPrevia(pedido.id)}
                            disabled={loading || loadingPreview[pedido.id]}
                            className="w-full py-1.5 text-xs font-bold text-purpura-600 hover:bg-purpura-50 border border-purpura-200 rounded-lg dark:hover:bg-purpura-500/10 transition-colors flex justify-center items-center gap-1"
                          >
                            {loading || loadingPreview[pedido.id] ? <Loader2 size={12} className="animate-spin" /> : null}
                            Emitir Factura SRI
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}

                {estado.id === 'COTIZACION' && (
                  <Link href="/pedidos/nuevo" className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold text-gray-500 hover:text-purpura-500 hover:border-purpura-500/50 hover:bg-purpura-50 dark:hover:bg-purpura-500/10 transition-colors mt-2">
                    <Plus size={16} />
                    Nueva Cotización
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Preview Modal */}
      {previewData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0b18] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-white/5 bg-[#0e0e1e] flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-white">Vista Previa de Comprobante SRI</h3>
                <p className="text-xs text-gray-400">Revisa la estructura del comprobante electrónico antes de firmar y emitir</p>
              </div>
              <span className="text-xs font-bold bg-purpura-500/10 text-purpura-400 border border-purpura-500/20 px-3 py-1 rounded-full">
                {previewData.emisor.ambiente}
              </span>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm text-gray-300">
              
              {/* Estructura y Clave */}
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                  <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Número de Factura Precalculado:</span>
                  <span className="text-white font-mono text-sm font-bold">{previewData.numeroFactura}</span>
                </div>
                <div className="text-xs text-gray-400 font-medium">
                  Secuencial asignado: <span className="text-purpura-400 font-bold">{previewData.secuencial}</span> (basado en el establecimiento <span className="text-white">{previewData.emisor.establecimiento}</span> y punto de emisión <span className="text-white">{previewData.emisor.puntoEmision}</span>).
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/1 p-3 rounded-xl border border-white/5">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-1">Emisor</h4>
                  <p className="font-bold text-white text-xs">{previewData.emisor.razonSocial}</p>
                  <p className="text-xs text-gray-400">RUC: {previewData.emisor.ruc}</p>
                </div>
                <div className="bg-white/1 p-3 rounded-xl border border-white/5">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-1">Receptor (Cliente)</h4>
                  <p className="font-bold text-white text-xs">{previewData.cliente.nombre}</p>
                  <p className="text-xs text-gray-400">Identificación: {previewData.cliente.identificacion} ({previewData.cliente.tipoIdentificacion})</p>
                  <p className="text-xs text-gray-400">Dirección: {previewData.cliente.direccion || 'S/D'}</p>
                </div>
              </div>

              {/* Items */}
              <div className="border border-white/5 rounded-xl overflow-hidden bg-black/30">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5 text-gray-400 uppercase font-bold">
                      <th className="p-3">Descripción</th>
                      <th className="p-3 text-center">Cant.</th>
                      <th className="p-3 text-right">Unitario</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.pedido.items.map((item: any, i: number) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/1">
                        <td className="p-3 font-semibold text-white">{item.nombre}</td>
                        <td className="p-3 text-center">{item.cantidad}</td>
                        <td className="p-3 text-right">${item.precioUnitario.toFixed(2)}</td>
                        <td className="p-3 text-right font-semibold text-white">${item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totales */}
              <div className="flex justify-end text-xs">
                <div className="w-48 space-y-1.5 text-gray-400">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-bold text-white">${previewData.pedido.subtotal.toFixed(2)}</span>
                  </div>
                  {previewData.pedido.descuento > 0 && (
                    <div className="flex justify-between text-red-400">
                      <span>Descuento:</span>
                      <span>-${previewData.pedido.descuento.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>IVA 15%:</span>
                    <span className="font-bold text-white">${previewData.pedido.iva.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-1.5 text-sm font-black text-white">
                    <span>Total:</span>
                    <span className="text-verde-400 font-black">${previewData.pedido.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 bg-[#0e0e1e] flex justify-end gap-3">
              <button
                onClick={() => setPreviewData(null)}
                className="px-4 py-2 border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const pedidoId = previewData.pedidoId
                  setPreviewData(null)
                  const emitPromise = emitirFacturaSRIAction(pedidoId)

                  toast.promise(
                    emitPromise,
                    {
                      loading: 'Firmando comprobante XML y conectando con el SRI...',
                      success: (res) => {
                        router.refresh()
                        return `¡Factura autorizada exitosamente! Nº: ${res.numeroAutorizacion}`
                      },
                      error: (err) => err.message || 'Error al emitir factura al SRI',
                    }
                  )

                  try {
                    const res = await emitPromise
                    const pedido = pedidos.find(p => p.id === pedidoId)
                    if (res && res.success && pedido && pedido.cliente.email) {
                      setTimeout(async () => {
                        try {
                          const facturaDummy = {
                            estado: 'AUTORIZADA',
                            claveAcceso: res.accessKey,
                            numeroAutorizacion: res.numeroAutorizacion
                          }
                          const doc = await generarRidePDF(pedido, emisor, facturaDummy, false)
                          const dataUrl = doc.output('datauristring')
                          const base64 = dataUrl.split(',')[1]
                          await enviarFacturaEmailAction(pedidoId, base64)
                          toast.success(`Factura enviada automáticamente al correo: ${pedido.cliente.email}`)
                        } catch (mailErr: any) {
                          console.error('Error al enviar correo automático:', mailErr)
                          toast.error(`Factura autorizada, pero no se pudo enviar el correo automático: ${mailErr.message}`)
                        }
                      }, 1500)
                    }
                  } catch (err) {
                    // toast.promise already handles error
                  } finally {
                    setLoadingInvoice(prev => ({ ...prev, [pedidoId]: false }))
                  }
                }}
                className="px-5 py-2 bg-purpura-600 hover:bg-purpura-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-purpura-500/20"
              >
                Firmar y Emitir al SRI 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
