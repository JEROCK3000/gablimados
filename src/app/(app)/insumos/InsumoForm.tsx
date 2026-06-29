'use client'

import { useState } from 'react'
import { createInsumoAction, updateInsumoAction } from './actions'
import { X, Save, Loader2, Package } from 'lucide-react'

interface Insumo {
  id?: number
  nombre: string
  tipo: string
  cantidadComprada: number
  costoTotal: number
  proveedor: string | null
  stockActual: number
}

interface InsumoFormProps {
  insumoInicial?: Insumo
  onClose: () => void
}

export function InsumoForm({ insumoInicial, onClose }: InsumoFormProps) {
  const [formData, setFormData] = useState<Insumo>(
    insumoInicial || {
      nombre: '',
      tipo: 'BLANK',
      cantidadComprada: 1,
      costoTotal: 0,
      proveedor: '',
      stockActual: 1,
    }
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isEdit = !!insumoInicial?.id

  const costoUnitario = (formData.costoTotal / (formData.cantidadComprada || 1)).toFixed(2)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      ...formData,
      stockActual: isEdit ? formData.stockActual : formData.cantidadComprada,
    }

    try {
      let res
      if (isEdit) {
        res = await updateInsumoAction(insumoInicial!.id!, payload)
      } else {
        res = await createInsumoAction(payload)
      }

      if (res.error) {
        setError(res.error)
      } else {
        onClose()
      }
    } catch (err) {
      setError('Error inesperado al guardar')
    } finally {
      setLoading(false)
    }
  }

  const tiposInsumo = [
    { id: 'BLANK', label: 'Producto en blanco (Tazas, etc)' },
    { id: 'PAPEL', label: 'Papel de sublimación' },
    { id: 'TINTA', label: 'Tinta' },
    { id: 'EMPAQUE', label: 'Empaque / Cajas' },
    { id: 'OTRO', label: 'Otro material' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-[#1e1e32] w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purpura-500/10 flex items-center justify-center text-purpura-500">
              <Package size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">
                {isEdit ? 'Editar Insumo' : 'Registrar Compra'}
              </h3>
              <p className="text-sm text-gray-500">Calcula tu costo unitario real</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-500 text-sm flex items-center gap-2">
              <span>⚠️</span>
              {error}
            </div>
          )}

          <form id="insumo-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nombre del artículo</label>
              <input
                type="text"
                required
                className="input"
                placeholder="Ej. Caja de 36 Tazas 11oz"
                value={formData.nombre}
                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Categoría</label>
              <select
                className="input"
                value={formData.tipo}
                onChange={e => setFormData({ ...formData, tipo: e.target.value })}
              >
                {tiposInsumo.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Unidades que trae</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="input"
                  value={formData.cantidadComprada}
                  onChange={e => setFormData({ ...formData, cantidadComprada: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="label">Costo Total ($)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="input font-bold text-red-500"
                  value={formData.costoTotal}
                  onChange={e => setFormData({ ...formData, costoTotal: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            {isEdit && (
              <div>
                <label className="label">Stock Actual (Unidades restantes)</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="input"
                  value={formData.stockActual}
                  onChange={e => setFormData({ ...formData, stockActual: parseInt(e.target.value) || 0 })}
                />
              </div>
            )}

            <div>
              <label className="label">Proveedor (Opcional)</label>
              <input
                type="text"
                className="input"
                placeholder="¿Dónde lo compraste?"
                value={formData.proveedor || ''}
                onChange={e => setFormData({ ...formData, proveedor: e.target.value })}
              />
            </div>
          </form>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Costo unitario calculado</span>
            <span className="text-xl font-black text-verde-500">${costoUnitario}</span>
          </div>

          <button
            type="submit"
            form="insumo-form"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} className="mr-2" />}
            {isEdit ? 'Guardar Cambios' : 'Registrar Compra'}
          </button>
        </div>
      </div>
    </div>
  )
}
