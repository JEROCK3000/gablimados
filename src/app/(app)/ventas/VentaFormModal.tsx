'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { crearPedidoAction, actualizarPedidoAction } from '../pedidos/actions'
import { ClienteForm } from '../clientes/ClienteForm'
import { toast } from 'sonner'

interface Props {
  isOpen: boolean
  onClose: () => void
  clientes: Array<{ id: number; nombre: string; identificacion: string }>
  productos: Array<{ id: number; nombre: string; precio: number }>
  venta?: {
    id: number
    numero: string
    clienteId: number
    formaPago: string
    notas: string | null
    descuento: number
    items: Array<{
      productoId: number
      cantidad: number
      precioUnitario: number
      subtotal: number
    }>
  } | null
}

export function VentaFormModal({ isOpen, onClose, clientes, productos, venta }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showQuickClient, setShowQuickClient] = useState(false)
  
  const [clienteId, setClienteId] = useState<number | ''>('')
  const [formaPago, setFormaPago] = useState('01')
  const [notas, setNotas] = useState('')
  const [descuentoGlobal, setDescuentoGlobal] = useState(0)
  
  const [items, setItems] = useState<Array<{
    uid: string
    productoId: number | ''
    cantidad: number
    precioUnitario: number
  }>>([{ uid: crypto.randomUUID(), productoId: '', cantidad: 1, precioUnitario: 0 }])

  // Load editing data if present
  useEffect(() => {
    if (venta) {
      setClienteId(venta.clienteId)
      setFormaPago(venta.formaPago)
      setNotas(venta.notas || '')
      setDescuentoGlobal(venta.descuento)
      setItems(venta.items.map(it => ({
        uid: crypto.randomUUID(),
        productoId: it.productoId,
        cantidad: it.cantidad,
        precioUnitario: it.precioUnitario
      })))
    } else {
      setClienteId('')
      setFormaPago('01')
      setNotas('')
      setDescuentoGlobal(0)
      setItems([{ uid: crypto.randomUUID(), productoId: '', cantidad: 1, precioUnitario: 0 }])
    }
  }, [venta, isOpen])

  if (!isOpen) return null

  const agregarFila = () => {
    setItems(prev => [...prev, { uid: crypto.randomUUID(), productoId: '', cantidad: 1, precioUnitario: 0 }])
  }

  const removerFila = (uid: string) => {
    if (items.length === 1) return
    setItems(prev => prev.filter(i => i.uid !== uid))
  }

  const updateItem = (uid: string, field: string, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      
      const updated = { ...item, [field]: value }
      if (field === 'productoId') {
        const prod = productos.find(p => p.id === Number(value))
        if (prod) updated.precioUnitario = prod.precio
      }
      return updated
    }))
  }

  const subtotalItems = items.reduce((acc, i) => acc + (i.cantidad * i.precioUnitario), 0)
  const subtotalNeto = Math.max(0, subtotalItems - descuentoGlobal)
  const iva = subtotalNeto * 0.15 // IVA 15% Ecuador
  const total = subtotalNeto + iva

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clienteId) return toast.error('Selecciona un cliente')
    
    const itemsValidos = items.filter(i => i.productoId !== '')
    if (itemsValidos.length === 0) return toast.error('Agrega al menos un producto')

    setLoading(true)
    try {
      const payload = {
        clienteId: Number(clienteId),
        estado: 'VENTA', // Direct sales bypass the Kanban board
        formaPago,
        notas,
        subtotal: subtotalItems,
        descuento: descuentoGlobal,
        iva,
        total,
        items: itemsValidos.map(i => ({
          productoId: Number(i.productoId),
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
          subtotal: i.cantidad * i.precioUnitario
        }))
      }

      if (venta) {
        await actualizarPedidoAction(venta.id, payload)
        toast.success('Venta actualizada exitosamente.')
      } else {
        await crearPedidoAction(payload)
        toast.success('Venta registrada exitosamente.')
      }
      
      onClose()
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar la venta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl shadow-2xl border border-gray-100 dark:border-white/10 flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 rounded-t-2xl z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {venta ? `Editar Venta - ${venta.numero}` : 'Registrar Nueva Venta Directa'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="venta-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="card grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Cliente *</label>
                <div className="flex gap-2">
                  <select 
                    value={clienteId} 
                    onChange={e => setClienteId(Number(e.target.value) || '')}
                    className="input flex-1"
                    required
                  >
                    <option value="">Seleccionar cliente...</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} ({c.identificacion})</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowQuickClient(true)}
                    className="btn-secondary px-3 h-10 flex items-center justify-center rounded-xl"
                    title="Crear Cliente Rápido"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Forma de Pago (SRI) *</label>
                <select
                  value={formaPago}
                  onChange={e => setFormaPago(e.target.value)}
                  className="input"
                  required
                >
                  <option value="01">Sin utilización del sistema financiero (Efectivo)</option>
                  <option value="16">Tarjeta de Débito</option>
                  <option value="19">Tarjeta de Crédito</option>
                  <option value="20">Otros con utilización del sistema financiero (Transferencia/Cheque/Depósito)</option>
                </select>
              </div>
            </div>

            <div className="card space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Detalle de Productos</h3>
                <button
                  type="button"
                  onClick={agregarFila}
                  className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
                >
                  <Plus size={14} />
                  Agregar Fila
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={item.uid} className="flex flex-col sm:flex-row gap-3 items-end sm:items-center bg-gray-50/50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                    <div className="flex-1 w-full">
                      <label className="label sm:hidden">Producto</label>
                      <select
                        value={item.productoId}
                        onChange={e => updateItem(item.uid, 'productoId', e.target.value)}
                        className="input"
                        required
                      >
                        <option value="">Seleccionar producto...</option>
                        {productos.map(p => (
                          <option key={p.id} value={p.id}>{p.nombre} (${p.precio.toFixed(2)})</option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full sm:w-28">
                      <label className="label sm:hidden">Cant.</label>
                      <input
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={e => updateItem(item.uid, 'cantidad', parseInt(e.target.value) || 1)}
                        className="input text-center"
                        required
                      />
                    </div>

                    <div className="w-full sm:w-36">
                      <label className="label sm:hidden">P. Unitario</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.precioUnitario}
                        onChange={e => updateItem(item.uid, 'precioUnitario', parseFloat(e.target.value) || 0)}
                        className="input text-right font-mono"
                        required
                      />
                    </div>

                    <div className="w-full sm:w-36 text-right font-mono font-bold text-gray-900 dark:text-white px-2">
                      ${(item.cantidad * item.precioUnitario).toFixed(2)}
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removerFila(item.uid)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors self-end sm:self-auto"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div>
                <label className="label">Notas Internas</label>
                <textarea
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  placeholder="Detalles sobre el pedido, entrega o facturación..."
                  className="input h-28 resize-none"
                />
              </div>

              <div className="card bg-gray-50/50 dark:bg-white/5 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold">${subtotalItems.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Descuento Global</span>
                  <div className="w-32">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={subtotalItems}
                      value={descuentoGlobal}
                      onChange={e => setDescuentoGlobal(Math.min(subtotalItems, Math.max(0, parseFloat(e.target.value) || 0)))}
                      className="input text-right font-mono py-1.5 h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">IVA (15%)</span>
                  <span className="font-semibold">${iva.toFixed(2)}</span>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-white/10 flex justify-between items-center">
                  <span className="font-bold text-gray-900 dark:text-white">Total a Pagar</span>
                  <span className="text-lg font-black text-verde-600 dark:text-verde-400">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="p-5 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-gray-900 rounded-b-2xl z-10">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary px-6"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="venta-form"
            disabled={loading}
            className="btn-primary flex items-center gap-2 px-8"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {loading ? 'Guardando...' : (venta ? 'Actualizar Venta' : 'Registrar Venta')}
          </button>
        </div>
      </div>

      {showQuickClient && (
        <ClienteForm
          onClose={() => {
            setShowQuickClient(false)
            router.refresh()
          }}
          onSuccess={(nuevo) => {
            setShowQuickClient(false)
            setClienteId(nuevo.id)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
