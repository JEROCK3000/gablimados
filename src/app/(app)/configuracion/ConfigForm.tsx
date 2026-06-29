'use client'

import { useState } from 'react'
import { guardarCostosAction } from './actions'
import { Save, Loader2 } from 'lucide-react'

interface Props {
  costosMes: {
    id: number
    alquiler: number
    electricidad: number
    salarios: number
    internet: number
    agua: number
    transporte: number
    otros: number
    horasMes: number
    piezasMes: number
  } | null
  mes: number
  anio: number
}

export function ConfigForm({ costosMes, mes, anio }: Props) {
  const [form, setForm] = useState({
    alquiler: costosMes?.alquiler ?? 0,
    electricidad: costosMes?.electricidad ?? 0,
    salarios: costosMes?.salarios ?? 0,
    internet: costosMes?.internet ?? 0,
    agua: costosMes?.agua ?? 0,
    transporte: costosMes?.transporte ?? 0,
    otros: costosMes?.otros ?? 0,
    horasMes: costosMes?.horasMes ?? 160,
    piezasMes: costosMes?.piezasMes ?? 200,
  })

  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const total = form.alquiler + form.electricidad + form.salarios +
    form.internet + form.agua + form.transporte + form.otros

  const costoPorPieza = form.piezasMes > 0 ? total / form.piezasMes : 0

  const set = (campo: string, valor: number) => {
    setForm(prev => ({ ...prev, [campo]: valor }))
    setSaved(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await guardarCostosAction({ ...form, mes, anio, id: costosMes?.id })
      setSaved(true)
    } catch (err: any) {
      setError(err.message || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const costos = [
    { campo: 'alquiler', label: 'Alquiler / renta', emoji: '🏠' },
    { campo: 'electricidad', label: 'Electricidad', emoji: '⚡' },
    { campo: 'salarios', label: 'Salarios', emoji: '👤' },
    { campo: 'internet', label: 'Internet / teléfono', emoji: '📱' },
    { campo: 'agua', label: 'Agua', emoji: '💧' },
    { campo: 'transporte', label: 'Transporte', emoji: '🚗' },
    { campo: 'otros', label: 'Otros gastos', emoji: '📦' },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Costos fijos */}
      <div className="card">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Gastos fijos mensuales</h3>
        <div className="space-y-3">
          {costos.map(({ campo, label, emoji }) => (
            <div key={campo} className="flex items-center gap-3">
              <span className="text-xl w-7 flex-shrink-0">{emoji}</span>
              <label className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
              <div className="relative w-36">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={(form as any)[campo] || ''}
                  onChange={e => set(campo, parseFloat(e.target.value) || 0)}
                  className="input pl-6 text-right"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
          <span className="font-bold text-gray-900 dark:text-white">Total mensual</span>
          <span className="text-xl font-black text-verde-600 dark:text-verde-400">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Producción */}
      <div className="card">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Volumen de producción</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Horas de trabajo por mes</label>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="1"
                value={form.horasMes}
                onChange={e => set('horasMes', parseInt(e.target.value) || 1)}
                className="input !pr-16"
              />
              <span className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">hrs</span>
            </div>
          </div>
          <div>
            <label className="label">Piezas que produces por mes</label>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="1"
                value={form.piezasMes}
                onChange={e => set('piezasMes', parseInt(e.target.value) || 1)}
                className="input !pr-20"
              />
              <span className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">piezas</span>
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div className="mt-4 p-4 rounded-xl resultado-card">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Costo fijo por pieza</p>
              <p className="text-2xl font-black text-purpura-600 dark:text-purpura-400">
                ${costoPorPieza.toFixed(4)}
              </p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Costo hora trabajada</p>
              <p className="text-2xl font-black text-verde-600 dark:text-verde-400">
                ${form.horasMes > 0 ? (total / form.horasMes).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {saved && (
        <div className="p-3 rounded-xl bg-verde-50 dark:bg-verde-500/10 border border-verde-200 dark:border-verde-500/20 text-verde-600 dark:text-verde-400 text-sm">
          ✅ Configuración guardada correctamente
        </div>
      )}

      <button
        id="btn-guardar-config"
        type="submit"
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {loading ? 'Guardando...' : 'Guardar configuración'}
      </button>
    </form>
  )
}
