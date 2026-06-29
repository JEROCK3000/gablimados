'use client'

import { useState } from 'react'
import { Plus, Trash2, Save, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { crearPedidoAction } from '../actions'
import { ClienteForm } from '../../clientes/ClienteForm'

interface Props {
  clientes: Array<{ id: number, nombre: string, identificacion: string }>
  productos: Array<{ id: number, nombre: string, precio: number }>
}

export function PedidoForm({ clientes, productos }: Props) {
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
  const subtotalNeto = subtotalItems - descuentoGlobal
  const iva = subtotalNeto * 0.15 // IVA 15% Ecuador
  const total = subtotalNeto + iva

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clienteId) return alert('Selecciona un cliente')
    
    const itemsValidos = items.filter(i => i.productoId !== '')
    if (itemsValidos.length === 0) return alert('Agrega al menos un producto')

    setLoading(true)
    try {
      await crearPedidoAction({
        clienteId: Number(clienteId),
        estado: 'COTIZACION',
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
      })
      router.push('/pedidos')
    } catch (err: any) {
      alert(err.message)
      setLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card space-y-4">
        <h3 className="font-bold text-gray-900 dark:text-white">Datos del Cliente</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div>
          <label className="label">Notas (Opcional)</label>
          <textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            className="input resize-none"
            rows={2}
            placeholder="Ej: Entregar el martes en la mañana"
          />
        </div>
      </div>

      <div className="card space-y-4">
        <h3 className="font-bold text-gray-900 dark:text-white">Productos</h3>
        
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.uid} className="flex gap-3 items-end">
              <div className="flex-1">
                {index === 0 && <label className="label">Producto</label>}
                <select
                  value={item.productoId}
                  onChange={e => updateItem(item.uid, 'productoId', e.target.value)}
                  className="input"
                  required
                >
                  <option value="">Seleccionar producto...</option>
                  {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div className="w-24 relative">
                {index === 0 && <label className="label">Cant.</label>}
                <input
                  type="number"
                  min="1"
                  value={item.cantidad || ''}
                  onChange={e => updateItem(item.uid, 'cantidad', parseInt(e.target.value) || 0)}
                  className="input !pr-10"
                />
              </div>
              <div className="w-32 relative">
                {index === 0 && <label className="label">P.Unit</label>}
                <span className="absolute left-3 bottom-2.5 text-gray-400 font-medium">$</span>
                <input
                  type="number"
                  step="any"
                  value={item.precioUnitario || ''}
                  onChange={e => updateItem(item.uid, 'precioUnitario', parseFloat(e.target.value) || 0)}
                  className="input !pl-8"
                />
              </div>
              <button
                type="button"
                onClick={() => removerFila(item.uid)}
                disabled={items.length === 1}
                className="p-3 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        <button type="button" onClick={agregarFila} className="btn-ghost text-sm py-2">
          <Plus size={16} className="inline mr-2" /> Agregar Fila
        </button>
      </div>

      <div className="card max-w-sm ml-auto space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-semibold">${subtotalItems.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Descuento</span>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
            <input
              type="number"
              step="any"
              value={descuentoGlobal || ''}
              onChange={e => setDescuentoGlobal(parseFloat(e.target.value) || 0)}
              className="input w-24 h-8 !pl-6 py-1 px-2 text-sm"
            />
          </div>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">IVA (15%)</span>
          <span className="font-semibold">${iva.toFixed(2)}</span>
        </div>
        <div className="pt-3 border-t border-gray-100 dark:border-white/10 flex justify-between items-center">
          <span className="font-bold text-gray-900 dark:text-white">Total a Pagar</span>
          <span className="text-xl font-black text-verde-600 dark:text-verde-400">${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-white/10">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex items-center gap-2 px-8 py-3"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {loading ? 'Guardando...' : 'Guardar Cotización'}
        </button>
      </div>
    </form>

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
    </>
  )
}
