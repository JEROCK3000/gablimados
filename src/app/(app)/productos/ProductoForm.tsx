'use client'

import { useState } from 'react'
import { calcularPrecio } from '@/lib/calculadora/engine'
import { crearProductoAction, actualizarProductoAction } from './actions'
import { useRouter } from 'next/navigation'
import { Save, Loader2, Calculator } from 'lucide-react'

interface Props {
  categorias: Array<{ id: number; nombre: string }>
  totalCostosFijos: number
  piezasMes: number
  producto?: {
    id: number
    nombre: string
    descripcion: string | null
    categoriaId: number
    costoInsumo: number
    costoPapel: number
    costoTinta: number
    costoElectrico: number
    margen: number
  }
  initialData?: Record<string, string | undefined>
}

export function ProductoForm({ categorias, totalCostosFijos, piezasMes, producto, initialData }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nombre: producto?.nombre ?? initialData?.nombre ?? '',
    descripcion: producto?.descripcion ?? '',
    categoriaId: producto?.categoriaId ?? (initialData?.categoriaId ? Number(initialData.categoriaId) : (categorias[0]?.id ?? 0)),
    costoInsumo: producto?.costoInsumo ?? (initialData?.costoInsumo ? Number(initialData.costoInsumo) : 0),
    costoPapel: producto?.costoPapel ?? (initialData?.costoPapel ? Number(initialData.costoPapel) : 0),
    costoTinta: producto?.costoTinta ?? (initialData?.costoTinta ? Number(initialData.costoTinta) : 0),
    costoElectrico: producto?.costoElectrico ?? (initialData?.costoElectrico ? Number(initialData.costoElectrico) : 0),
    margen: producto?.margen ?? (initialData?.margen ? Number(initialData.margen) : 30),
  })

  // Calcular automáticamente
  const costoFijoPieza = piezasMes > 0 ? totalCostosFijos / piezasMes : 0
  const costoTotal = form.costoInsumo + form.costoPapel + form.costoTinta + form.costoElectrico + costoFijoPieza
  const precioMinimo = costoTotal
  const precioSugerido = form.margen < 100 ? costoTotal / (1 - form.margen / 100) : costoTotal * 2

  const set = (campo: string, valor: string | number) => {
    setForm(prev => ({ ...prev, [campo]: valor }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim()) {
      setError('El nombre es requerido')
      return
    }
    if (!form.categoriaId) {
      setError('Selecciona una categoría')
      return
    }

    setLoading(true)
    setError('')

    try {
      const datos = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        categoriaId: Number(form.categoriaId),
        costoInsumo: form.costoInsumo,
        costoPapel: form.costoPapel,
        costoTinta: form.costoTinta,
        costoElectrico: form.costoElectrico,
        costoFijoPieza,
        costoTotal,
        precioMinimo,
        precioSugerido,
        margen: form.margen,
      }

      if (producto?.id) {
        await actualizarProductoAction(producto.id, datos)
      } else {
        await crearProductoAction(datos)
      }

      router.push('/productos')
    } catch (err: any) {
      setError(err.message || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

const InputField = ({
  label, campo, type = 'text', prefix, suffix, placeholder, form, set
}: {
  label: string
  campo: string
  type?: string
  prefix?: string
  suffix?: string
  placeholder?: string
  form: any
  set: (c: string, v: any) => void
}) => {
  const initialVal = form[campo]
  const [localVal, setLocalVal] = useState(initialVal === 0 && type === 'number' ? '' : String(initialVal || ''))

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setLocalVal(val)
    if (type === 'number') {
      const num = parseFloat(val)
      if (!isNaN(num)) {
        set(campo, num)
      } else if (val === '') {
        set(campo, 0)
      }
    } else {
      set(campo, val)
    }
  }

  const handleBlur = () => {
    if (type === 'number') {
      setLocalVal(form[campo] === 0 ? '' : String(form[campo]))
    }
  }

  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">{prefix}</span>}
        <input
          type={type}
          step="any"
          min="0"
          value={localVal}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`input ${prefix ? '!pl-8' : ''} ${suffix ? '!pr-12' : ''}`}
        />
        {suffix && <span className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium pointer-events-none">{suffix}</span>}
      </div>
    </div>
  )
}

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Info básica */}
      <div className="card space-y-4">
        <h3 className="font-bold text-gray-900 dark:text-white">Información básica</h3>
        <InputField form={form} set={set} label="Nombre del producto" campo="nombre" placeholder="Ej: Camiseta básica sublimada" />
        <div>
          <label className="label">Descripción (opcional)</label>
          <textarea
            value={form.descripcion}
            onChange={e => set('descripcion', e.target.value)}
            placeholder="Descripción breve del producto..."
            rows={2}
            className="input resize-none"
          />
        </div>
        <div>
          <label className="label">Categoría</label>
          <select
            value={form.categoriaId}
            onChange={e => set('categoriaId', Number(e.target.value))}
            className="input"
          >
            <option value="">Seleccionar categoría</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      </div>

      {/* Costos */}
      <div className="card space-y-4">
        <h3 className="font-bold text-gray-900 dark:text-white">Costos por pieza</h3>
        <div className="grid grid-cols-2 gap-4">
          <InputField form={form} set={set} label="Insumo / producto en blanco" campo="costoInsumo" type="number" prefix="$" />
          <InputField form={form} set={set} label="Papel transfer" campo="costoPapel" type="number" prefix="$" />
          <InputField form={form} set={set} label="Tinta (total por pieza)" campo="costoTinta" type="number" prefix="$" />
          <InputField form={form} set={set} label="Electricidad por pieza" campo="costoElectrico" type="number" prefix="$" />
        </div>
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/3 text-sm text-gray-600 dark:text-gray-400">
          Costos fijos por pieza: <strong className="text-dorado-500">${costoFijoPieza.toFixed(4)}</strong>
          <span className="text-xs ml-2 text-gray-400">(${totalCostosFijos} fijos ÷ {piezasMes} piezas/mes)</span>
        </div>
      </div>

      {/* Margen */}
      <div className="card">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Margen de ganancia</h3>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Margen deseado</label>
          <span className="text-xl font-black text-verde-600 dark:text-verde-400">{form.margen}%</span>
        </div>
        <input
          type="range" min="5" max="200" step="5"
          value={form.margen}
          onChange={e => set('margen', Number(e.target.value))}
          className="w-full accent-verde-500"
        />

        {/* Preview de precios */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center p-3 rounded-xl bg-red-50 dark:bg-red-500/10">
            <p className="text-xs text-gray-500 mb-1">Costo total</p>
            <p className="font-black text-red-500">${costoTotal.toFixed(2)}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-orange-50 dark:bg-orange-500/10">
            <p className="text-xs text-gray-500 mb-1">Precio mínimo</p>
            <p className="font-black text-orange-500">${precioMinimo.toFixed(2)}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-verde-50 dark:bg-verde-500/10">
            <p className="text-xs text-gray-500 mb-1">Precio sugerido</p>
            <p className="font-black text-verde-600 dark:text-verde-400">${precioSugerido.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          id="btn-guardar-producto"
          disabled={loading}
          className="btn-primary flex items-center gap-2 flex-1 justify-center"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {loading ? 'Guardando...' : producto ? 'Actualizar producto' : 'Guardar producto'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/productos')}
          className="btn-ghost px-5"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
