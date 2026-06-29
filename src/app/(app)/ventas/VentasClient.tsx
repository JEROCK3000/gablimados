'use client'

import { useState, useTransition } from 'react'
import { 
  Search, 
  Plus, 
  FileText, 
  Trash2, 
  Edit3, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Download, 
  Send, 
  Eye, 
  X,
  CreditCard,
  DollarSign
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { eliminarPedidoAction } from '../pedidos/actions'
import { emitirFacturaSRIAction, obtenerVistaPreviaFactura, enviarFacturaEmailAction } from '../pedidos/sri-actions'
import { generarRidePDF } from '@/lib/reports/ride'
import { toast } from 'sonner'
import { VentaFormModal } from './VentaFormModal'

type Item = {
  productoId: number
  cantidad: number
  precioUnitario: number
  subtotal: number
  producto: {
    nombre: string
  }
}

type Venta = {
  id: number
  numero: string
  estado: string
  subtotal: number
  iva: number
  descuento: number
  total: number
  formaPago: string
  fecha: string
  clienteId: number
  cliente: {
    nombre: string
    identificacion: string
    direccion: string | null
    email: string | null
  }
  itemsCount: number
  items: Item[]
  facturaSRI?: {
    estado: string
    claveAcceso: string
    numeroAutorizacion: string | null
    fechaAutorizacion: string | null
    xmlFirmado: string | null
    mensajeError?: string | null
  } | null
}

interface Props {
  ventas: Venta[]
  clientes: Array<{ id: number; nombre: string; identificacion: string }>
  productos: Array<{ id: number; nombre: string; precio: number }>
  emisor: any
}

export function VentasClient({ ventas, clientes, productos, emisor }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVenta, setEditingVenta] = useState<Venta | null>(null)
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null)
  const [previewData, setPreviewData] = useState<any>(null)
  
  // Loading states
  const [loadingInvoice, setLoadingInvoice] = useState<Record<number, boolean>>({})
  const [loadingPreview, setLoadingPreview] = useState<Record<number, boolean>>({})
  const [sendingEmail, setSendingEmail] = useState<Record<number, boolean>>({})

  // Filter sales list
  const filteredVentas = ventas.filter(v => {
    const term = search.toLowerCase()
    return (
      v.numero.toLowerCase().includes(term) ||
      v.cliente.nombre.toLowerCase().includes(term) ||
      v.cliente.identificacion.includes(term)
    )
  })

  // Format payment method
  const getFormaPagoLabel = (code: string) => {
    switch (code) {
      case '01': return 'Efectivo 💵'
      case '16': return 'Débito 💳'
      case '19': return 'Crédito 💳'
      case '20': return 'Transf. / Cheque 🏦'
      default: return 'Otros'
    }
  }

  // Handle sales deletion
  const handleEliminarVenta = async (id: number, numero: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la venta ${numero}? Esta acción es irreversible.`)) {
      return
    }

    try {
      await eliminarPedidoAction(id)
      toast.success(`Venta ${numero} eliminada exitosamente.`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar la venta')
    }
  }

  // Handle invoice emission
  const handleEmitirFactura = async (ventaId: number) => {
    if (!emisor) {
      toast.error('Debes configurar primero los datos de facturación SRI en Configuración > Facturación SRI.')
      return
    }

    setLoadingInvoice(prev => ({ ...prev, [ventaId]: true }))
    const emitPromise = emitirFacturaSRIAction(ventaId)

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
      const venta = ventas.find(v => v.id === ventaId)
      if (res && res.success && venta && venta.cliente.email) {
        setTimeout(async () => {
          try {
            const facturaDummy = {
              estado: 'AUTORIZADA',
              claveAcceso: res.accessKey,
              numeroAutorizacion: res.numeroAutorizacion
            }
            const doc = await generarRidePDF(venta, emisor, facturaDummy, false)
            const dataUrl = doc.output('datauristring')
            const base64 = dataUrl.split(',')[1]
            await enviarFacturaEmailAction(ventaId, base64)
            toast.success(`Factura enviada automáticamente al correo: ${venta.cliente.email}`)
          } catch (mailErr: any) {
            console.error('Error al enviar correo automático:', mailErr)
            toast.error(`Factura autorizada, pero no se pudo enviar el correo automático: ${mailErr.message}`)
          }
        }, 1500)
      }
    } catch (err) {
      // Handled by toast.promise
    } finally {
      setLoadingInvoice(prev => ({ ...prev, [ventaId]: false }))
    }
  }

  // Preview SRI Invoice
  const handleAbrirVistaPrevia = async (ventaId: number) => {
    if (!emisor) {
      toast.error('Debes configurar primero los datos de facturación SRI.')
      return
    }
    setLoadingPreview(prev => ({ ...prev, [ventaId]: true }))
    try {
      const res = await obtenerVistaPreviaFactura(ventaId)
      if (res.success) {
        setPreviewData({ ...res, pedidoId: ventaId })
        toast.success('Vista previa cargada con éxito.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al obtener vista previa')
    } finally {
      setLoadingPreview(prev => ({ ...prev, [ventaId]: false }))
    }
  }

  // Download PDF
  const handleDescargarRide = async (venta: Venta) => {
    if (!venta.facturaSRI) return
    try {
      const doc = await generarRidePDF(venta, emisor, venta.facturaSRI, true)
      doc.save(`factura-${venta.numero}.pdf`)
      toast.success('PDF del RIDE descargado exitosamente.')
    } catch (err: any) {
      toast.error('Error al generar PDF: ' + err.message)
    }
  }

  // Send Email Manually
  const handleEnviarEmail = async (venta: Venta) => {
    if (!venta.facturaSRI) return
    if (!venta.cliente.email) {
      toast.error('El cliente no posee un correo electrónico registrado.')
      return
    }

    setSendingEmail(prev => ({ ...prev, [venta.id]: true }))
    try {
      const doc = await generarRidePDF(venta, emisor, venta.facturaSRI, false)
      const dataUrl = doc.output('datauristring')
      const base64 = dataUrl.split(',')[1]
      
      await enviarFacturaEmailAction(venta.id, base64)
      toast.success(`Factura enviada exitosamente al correo: ${venta.cliente.email}`)
    } catch (err: any) {
      toast.error('Error al enviar correo: ' + err.message)
    } finally {
      setSendingEmail(prev => ({ ...prev, [venta.id]: false }))
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
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="text-verde-500" />
            Ventas Directas
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Módulo de facturación rápida y registro de ventas directas sin pasar por el tablero Kanban.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingVenta(null)
            setIsModalOpen(true)
          }}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Registrar Venta
        </button>
      </div>

      {/* Filter and search */}
      <div className="card">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número de venta, nombre de cliente o identificación..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input !pl-10 w-full"
          />
        </div>
      </div>

      {/* Sales table */}
      <div className="card p-0 overflow-hidden border border-gray-100 dark:border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/3 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-white/5 text-xs font-bold uppercase tracking-wider">
                <th className="p-4">Número</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Fecha</th>
                <th className="p-4">Forma de Pago</th>
                <th className="p-4 text-right">Total</th>
                <th className="p-4 text-center">Factura SRI</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filteredVentas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 dark:text-gray-500">
                    No se encontraron registros de ventas.
                  </td>
                </tr>
              ) : (
                filteredVentas.map(venta => {
                  const sris = venta.facturaSRI
                  const isAutorizada = sris?.estado === 'AUTORIZADA'
                  const isPendiente = sris?.estado === 'PENDIENTE'
                  const isRechazada = sris?.estado === 'RECHAZADA' || sris?.estado === 'DEVUELTA'
                  
                  return (
                    <tr key={venta.id} className="hover:bg-gray-50/50 dark:hover:bg-white/1 text-gray-700 dark:text-gray-300">
                      <td className="p-4 font-mono font-bold text-gray-900 dark:text-white">
                        {venta.numero}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {venta.cliente.nombre}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">
                          {venta.cliente.identificacion}
                        </div>
                      </td>
                      <td className="p-4 text-gray-500">
                        {venta.fecha}
                      </td>
                      <td className="p-4 text-xs font-medium">
                        {getFormaPagoLabel(venta.formaPago)}
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-gray-900 dark:text-white">
                        ${venta.total.toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center justify-center">
                          {isAutorizada ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                              <CheckCircle size={12} />
                              Autorizada
                            </span>
                          ) : isPendiente ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              <Clock size={12} />
                              Pendiente
                            </span>
                          ) : isRechazada ? (
                            <div className="group relative">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20 cursor-help">
                                <AlertCircle size={12} />
                                Rechazada
                              </span>
                              <div className="absolute z-10 bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-64 bg-gray-950 text-white text-xs p-3 rounded-lg shadow-xl border border-white/10 text-center leading-relaxed">
                                {sris?.mensajeError || 'Error desconocido'}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-500/10 text-gray-400 border border-gray-500/10">
                              No Facturado
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedVenta(venta)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-white rounded-lg transition-all"
                            title="Ver Detalle"
                          >
                            <Eye size={15} />
                          </button>
                          
                          {!isAutorizada && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingVenta(venta)
                                  setIsModalOpen(true)
                                }}
                                className="p-1.5 hover:bg-amber-500/10 text-gray-400 hover:text-amber-400 rounded-lg transition-all"
                                title="Editar"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                onClick={() => handleEliminarVenta(venta.id, venta.numero)}
                                className="p-1.5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-lg transition-all"
                                title="Eliminar"
                              >
                                <Trash2 size={15} />
                              </button>
                              
                              <button
                                onClick={() => handleAbrirVistaPrevia(venta.id)}
                                disabled={loadingInvoice[venta.id] || loadingPreview[venta.id]}
                                className="p-1.5 hover:bg-verde-500/10 text-gray-400 hover:text-verde-400 rounded-lg transition-all flex items-center justify-center"
                                title="Emitir Factura SRI"
                              >
                                {loadingPreview[venta.id] ? (
                                  <Loader2 size={15} className="animate-spin" />
                                ) : (
                                  <FileText size={15} />
                                )}
                              </button>
                            </>
                          )}

                          {isAutorizada && (
                            <>
                              <button
                                onClick={() => handleDescargarRide(venta)}
                                className="p-1.5 hover:bg-blue-500/10 text-gray-400 hover:text-blue-400 rounded-lg transition-all"
                                title="Descargar RIDE PDF"
                              >
                                <Download size={15} />
                              </button>
                              <button
                                onClick={() => handleEnviarEmail(venta)}
                                disabled={sendingEmail[venta.id]}
                                className="p-1.5 hover:bg-verde-500/10 text-gray-400 hover:text-verde-400 rounded-lg transition-all flex items-center justify-center"
                                title="Enviar por Correo"
                              >
                                {sendingEmail[venta.id] ? (
                                  <Loader2 size={15} className="animate-spin" />
                                ) : (
                                  <Send size={15} />
                                )}
                              </button>
                              {sris?.xmlFirmado && (
                                <button
                                  onClick={() => downloadXml(sris.xmlFirmado || '', `factura-${venta.numero}.xml`)}
                                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-white rounded-lg transition-all"
                                  title="Descargar XML SRI"
                                >
                                  <span className="text-[10px] font-black font-mono">XML</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Detail Modal */}
      {selectedVenta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-white/10 flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-white dark:bg-gray-900 rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Detalle de Venta {selectedVenta.numero}
              </h2>
              <button 
                onClick={() => setSelectedVenta(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-5 text-gray-700 dark:text-gray-300">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-400 block mb-0.5">Cliente:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{selectedVenta.cliente.nombre}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Identificación:</span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-white">{selectedVenta.cliente.identificacion}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Fecha:</span>
                  <span>{selectedVenta.fecha}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Forma de Pago:</span>
                  <span>{getFormaPagoLabel(selectedVenta.formaPago)}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-white/5 pt-4">
                <span className="text-gray-400 text-xs block mb-2">Productos Detallados:</span>
                <div className="space-y-2">
                  {selectedVenta.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs bg-gray-50 dark:bg-white/3 p-2.5 rounded-lg border border-gray-100 dark:border-white/5">
                      <div>
                        <span className="font-semibold text-gray-900 dark:text-white">{it.producto.nombre}</span>
                        <span className="text-gray-400 block mt-0.5">{it.cantidad} unidad(es) x ${it.precioUnitario.toFixed(2)}</span>
                      </div>
                      <span className="font-mono font-bold text-gray-900 dark:text-white">${it.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-white/5 pt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal:</span>
                  <span className="font-semibold">${selectedVenta.subtotal.toFixed(2)}</span>
                </div>
                {selectedVenta.descuento > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Descuento:</span>
                    <span>-${selectedVenta.descuento.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">IVA (15%):</span>
                  <span className="font-semibold">${selectedVenta.iva.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black border-t border-gray-100 dark:border-white/5 pt-2 text-gray-900 dark:text-white">
                  <span>Total Venta:</span>
                  <span className="text-verde-600 dark:text-verde-400">${selectedVenta.total.toFixed(2)}</span>
                </div>
              </div>

              {selectedVenta.notas && (
                <div className="border-t border-gray-100 dark:border-white/5 pt-4 text-xs">
                  <span className="text-gray-400 block mb-1">Notas Internas:</span>
                  <p className="bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg text-amber-600 dark:text-amber-400 italic">
                    "{selectedVenta.notas}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SRI Invoice Preview Modal */}
      {previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0b0b18] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[85vh] text-white">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#090914] rounded-t-2xl">
              <h2 className="text-base font-black flex items-center gap-2">
                <FileText className="text-purpura-400" size={18} />
                Comprobante Electrónico (Vista Previa)
              </h2>
              <button 
                onClick={() => setPreviewData(null)}
                className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="bg-white/3 border border-white/5 p-3.5 rounded-xl space-y-2">
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-gray-400">Emisor:</span>
                  <span className="font-bold">{previewData.emisor.razonSocial}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">RUC Emisor:</span>
                  <span className="font-mono">{previewData.emisor.ruc}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Comprobante Nº:</span>
                  <span className="font-mono text-purpura-400 font-bold">{previewData.numeroFactura}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ambiente SRI:</span>
                  <span className="font-bold text-amber-400">{previewData.emisor.ambiente}</span>
                </div>
              </div>

              <div className="bg-white/3 border border-white/5 p-3.5 rounded-xl space-y-2">
                <h3 className="font-bold text-gray-300 border-b border-white/5 pb-1">Datos del Comprador</h3>
                <div className="flex justify-between">
                  <span className="text-gray-400">Comprador:</span>
                  <span className="font-bold">{previewData.cliente.nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Identificación:</span>
                  <span className="font-mono">{previewData.cliente.identificacion}</span>
                </div>
                {previewData.cliente.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Correo Electrónico:</span>
                    <span>{previewData.cliente.email}</span>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="bg-white/3 border border-white/5 p-3.5 rounded-xl space-y-2">
                <h3 className="font-bold text-gray-300 border-b border-white/5 pb-1">Detalle del Comprobante</h3>
                <div className="space-y-1.5">
                  {previewData.pedido.items.map((it: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-[11px] py-1 border-b border-white/5 last:border-b-0">
                      <div>
                        <span className="font-semibold text-gray-200">{it.nombre}</span>
                        <span className="text-gray-400 block text-[9px]">{it.cantidad} u x ${it.precioUnitario.toFixed(2)}</span>
                      </div>
                      <span className="font-mono font-bold">${it.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-56 bg-white/3 border border-white/5 p-3 rounded-xl space-y-2 text-right">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subtotal:</span>
                    <span className="font-semibold">${previewData.pedido.subtotal.toFixed(2)}</span>
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
            <div className="p-4 border-t border-white/5 bg-[#090914] flex justify-end gap-3 rounded-b-2xl">
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
                  await handleEmitirFactura(pedidoId)
                }}
                className="px-5 py-2 bg-purpura-600 hover:bg-purpura-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-purpura-500/20"
              >
                Firmar y Emitir al SRI 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VentaFormModal */}
      <VentaFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingVenta(null)
        }}
        clientes={clientes}
        productos={productos}
        venta={editingVenta}
      />
    </div>
  )
}
