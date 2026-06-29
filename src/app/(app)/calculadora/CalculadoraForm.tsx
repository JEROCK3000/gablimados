'use client'

import { useState, useCallback } from 'react'
import { calcularPrecio, type InputCalculo, type ResultadoCalculo, formatMoneda } from '@/lib/calculadora/engine'
import { guardarCalculoAction } from './actions'
import {
  Calculator, Save, RefreshCw, Info, TrendingUp, DollarSign,
  Zap, Droplets, Package, BookOpen, ChevronDown, ChevronUp, PlusCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  totalCostosFijos: number
  piezasMes: number
  usuarioId: number
  categorias: Array<{ id: number; nombre: string; icono?: string | null }>
}

const defaultInput: InputCalculo = {
  costoInsumo: 0,
  costoPapel: 0,
  mlTintaCian: 0,
  mlTintaMagenta: 0,
  mlTintaAmarillo: 0,
  mlTintaNegro: 0,
  precioPorMlTinta: 0.05,
  wattsPrensadora: 1500,
  tiempoPresnadoSeg: 60,
  costoKwh: 0.12,
  totalCostosFijos: 0,
  piezasMes: 200,
  margen: 30,
}

const InputNumero = ({
  valor,
  onChange,
  label,
  prefix = '',
  suffix = '',
  step = 'any',
  min = '0',
  ayuda,
}: {
  valor: number
  onChange: (val: number) => void
  label: string
  prefix?: string
  suffix?: string
  step?: string
  min?: string
  ayuda?: string
}) => {
  const [localVal, setLocalVal] = useState(valor === 0 ? '' : valor.toString())

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setLocalVal(val)
    const num = parseFloat(val)
    if (!isNaN(num)) {
      onChange(num)
    } else if (val === '') {
      onChange(0)
    }
  }

  return (
    <div>
      <label className="label">
        {label}
        {ayuda && (
          <span className="ml-1 text-gray-400 text-[10px] font-normal">{ayuda}</span>
        )}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">{prefix}</span>
        )}
        <input
          type="number"
          step={step}
          min={min}
          value={localVal}
          onChange={handleChange}
          onBlur={() => setLocalVal(valor === 0 ? '' : valor.toString())}
          className={`input ${prefix ? '!pl-8' : ''} ${suffix ? '!pr-12' : ''}`}
        />
        {suffix && (
          <span className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium pointer-events-none">{suffix}</span>
        )}
      </div>
    </div>
  )
}

export function CalculadoraForm({ totalCostosFijos, piezasMes, usuarioId, categorias }: Props) {
  const router = useRouter()
  const [input, setInput] = useState<InputCalculo>({
    ...defaultInput,
    totalCostosFijos,
    piezasMes,
  })
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null)
  const [nombreCalc, setNombreCalc] = useState('')
  const [categoriaId, setCategoriaId] = useState<number | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [showTinta, setShowTinta] = useState(false)
  const [showFijos, setShowFijos] = useState(false)

  const actualizar = useCallback((campo: keyof InputCalculo, valor: number) => {
    setInput(prev => {
      const nuevo = { ...prev, [campo]: valor }
      setResultado(calcularPrecio(nuevo))
      return nuevo
    })
    setGuardado(false)
  }, [])

  const calcular = () => {
    const res = calcularPrecio(input)
    setResultado(res)
  }

  const limpiar = () => {
    setInput({ ...defaultInput, totalCostosFijos, piezasMes })
    setResultado(null)
    setNombreCalc('')
    setCategoriaId(null)
    setGuardado(false)
  }

  const guardar = async () => {
    if (!resultado || !nombreCalc.trim()) return
    setGuardando(true)
    try {
      await guardarCalculoAction({
        usuarioId,
        categoriaId,
        nombreCalc: nombreCalc.trim(),
        datos: input as unknown as Record<string, unknown>,
        resultado: resultado as unknown as Record<string, unknown>,
      })
      setGuardado(true)
    } finally {
      setGuardando(false)
    }
  }

  const crearComoProducto = () => {
    if (!resultado || !nombreCalc.trim()) return
    const params = new URLSearchParams()
    params.set('nombre', nombreCalc.trim())
    if (categoriaId) params.set('categoriaId', categoriaId.toString())
    params.set('costoInsumo', input.costoInsumo.toString())
    params.set('costoPapel', input.costoPapel.toString())
    
    const costoTinta = ((input.mlTintaCian + input.mlTintaMagenta + input.mlTintaAmarillo + input.mlTintaNegro) * input.precioPorMlTinta).toFixed(4)
    params.set('costoTinta', costoTinta)
    
    const kw = input.wattsPrensadora / 1000
    const horas = input.tiempoPresnadoSeg / 3600
    const costoElectrico = (kw * horas * input.costoKwh).toFixed(4)
    params.set('costoElectrico', costoElectrico)
    
    params.set('margen', input.margen.toString())
    
    router.push(`/productos/nuevo?${params.toString()}`)
  }

  const renderInput = (
    campo: keyof InputCalculo,
    label: string,
    prefix?: string,
    suffix?: string,
    step?: string,
    ayuda?: string,
    min?: string
  ) => (
    <InputNumero
      valor={input[campo]}
      onChange={(v) => actualizar(campo, v)}
      label={label}
      prefix={prefix}
      suffix={suffix}
      step={step}
      min={min}
      ayuda={ayuda}
    />
  )

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      {/* ── Formulario (izquierda) ─────────────────────────────────────── */}
      <div className="xl:col-span-3 space-y-4">
        {/* Nombre del cálculo */}
        <div className="card">
          <label className="label">Nombre del producto / cálculo</label>
          <input
            id="nombre-calc"
            type="text"
            value={nombreCalc}
            onChange={e => setNombreCalc(e.target.value)}
            placeholder="Ej: Camiseta básica blanca XL"
            className="input"
          />
          {categorias.length > 0 && (
            <div className="mt-3">
              <label className="label">Categoría (opcional)</label>
              <select
                value={categoriaId ?? ''}
                onChange={e => setCategoriaId(e.target.value ? Number(e.target.value) : null)}
                className="input"
              >
                <option value="">Sin categoría</option>
                {categorias.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Costos del producto */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purpura-500/15 flex items-center justify-center">
              <Package size={16} className="text-purpura-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">Insumos del producto</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputNumero valor={input.costoInsumo} onChange={v => actualizar('costoInsumo', v)} label="Costo del insumo (producto en blanco)" prefix="$" />
            <InputNumero valor={input.costoPapel} onChange={v => actualizar('costoPapel', v)} label="Costo del papel transfer" prefix="$" />
          </div>
        </div>

        {/* Tinta */}
        <div className="card">
          <button
            type="button"
            onClick={() => setShowTinta(!showTinta)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <Droplets size={16} className="text-blue-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">Costo de tinta</h3>
            </div>
            {showTinta ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {showTinta && (
            <div className="mt-4 space-y-4">
              <InputNumero
                valor={input.precioPorMlTinta}
                onChange={v => actualizar('precioPorMlTinta', v)}
                label="Precio por ml de tinta"
                prefix="$"
                ayuda="(precio promedio de tus tintas)"
              />
              <div className="grid grid-cols-2 gap-4">
                <InputNumero valor={input.mlTintaCian} onChange={v => actualizar('mlTintaCian', v)} label="ml Cian" suffix="ml" step="0.1" />
                <InputNumero valor={input.mlTintaMagenta} onChange={v => actualizar('mlTintaMagenta', v)} label="ml Magenta" suffix="ml" step="0.1" />
                <InputNumero valor={input.mlTintaAmarillo} onChange={v => actualizar('mlTintaAmarillo', v)} label="ml Amarillo" suffix="ml" step="0.1" />
                <InputNumero valor={input.mlTintaNegro} onChange={v => actualizar('mlTintaNegro', v)} label="ml Negro" suffix="ml" step="0.1" />
              </div>
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Total tinta: {(input.mlTintaCian + input.mlTintaMagenta + input.mlTintaAmarillo + input.mlTintaNegro).toFixed(2)} ml
                  {' → '}
                  {formatMoneda((input.mlTintaCian + input.mlTintaMagenta + input.mlTintaAmarillo + input.mlTintaNegro) * input.precioPorMlTinta)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Electricidad */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/15 flex items-center justify-center">
              <Zap size={16} className="text-yellow-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">Electricidad</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InputNumero valor={input.wattsPrensadora} onChange={v => actualizar('wattsPrensadora', v)} label="Watts de la prensadora" suffix="W" step="10" />
            <InputNumero valor={input.tiempoPresnadoSeg} onChange={v => actualizar('tiempoPresnadoSeg', v)} label="Tiempo de prensado" suffix="seg" step="5" />
            <InputNumero valor={input.costoKwh} onChange={v => actualizar('costoKwh', v)} label="Costo por kWh" prefix="$" />
          </div>
        </div>

        {/* Costos fijos */}
        <div className="card">
          <button
            type="button"
            onClick={() => setShowFijos(!showFijos)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-dorado-400/15 flex items-center justify-center">
                <BookOpen size={16} className="text-dorado-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-left">Costos fijos del negocio</h3>
                <p className="text-xs text-gray-500">Pre-cargado desde configuración</p>
              </div>
            </div>
            {showFijos ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {showFijos && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputNumero
                valor={input.totalCostosFijos}
                onChange={v => actualizar('totalCostosFijos', v)}
                label="Total costos fijos mensuales"
                prefix="$"
                ayuda="(suma de todos los gastos fijos)"
              />
              <InputNumero
                valor={input.piezasMes}
                onChange={v => actualizar('piezasMes', v)}
                label="Piezas que produces por mes"
                step="1"
                min="1"
              />
            </div>
          )}
        </div>

        {/* Margen */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-verde-500/15 flex items-center justify-center">
              <TrendingUp size={16} className="text-verde-500" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">Ganancia deseada</h3>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Margen de ganancia</label>
              <span className="text-2xl font-black text-verde-600 dark:text-verde-400">{input.margen}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="200"
              step="5"
              value={input.margen}
              onChange={e => actualizar('margen', Number(e.target.value))}
              className="w-full accent-verde-500 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>5%</span>
              <span>100%</span>
              <span>200%</span>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            id="btn-calcular"
            onClick={calcular}
            className="btn-primary flex items-center gap-2 flex-1"
          >
            <Calculator size={17} />
            Calcular precio
          </button>
          <button
            onClick={limpiar}
            className="btn-ghost flex items-center gap-2 px-4"
          >
            <RefreshCw size={15} />
            Limpiar
          </button>
        </div>
      </div>

      {/* ── Resultados (derecha) ────────────────────────────────────────── */}
      <div className="xl:col-span-2 space-y-4">
        {resultado ? (
          <>
            {/* Precio principal */}
            <div className="resultado-card rounded-2xl p-6">
              <div className="text-center mb-6">
                <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Precio sugerido de venta</p>
                <p className="text-5xl font-black precio-highlight">
                  {formatMoneda(resultado.precioSugerido)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Ganancia: <span className="text-verde-600 dark:text-verde-400 font-bold">{formatMoneda(resultado.gananciaPieza)}</span>
                  {' '}/pieza
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/50 dark:bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Costo total</p>
                  <p className="text-lg font-black text-red-500">{formatMoneda(resultado.costoTotal)}</p>
                </div>
                <div className="bg-white/50 dark:bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Precio mínimo</p>
                  <p className="text-lg font-black text-orange-500">{formatMoneda(resultado.precioMinimo)}</p>
                </div>
              </div>
            </div>

            {/* Desglose de costos */}
            <div className="card">
              <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Info size={15} className="text-purpura-400" />
                Desglose de costos
              </h4>
              <div className="space-y-3">
                {[
                  { label: 'Insumo / producto', valor: resultado.costoInsumo, pct: resultado.porcentajeDesglose.insumo, color: 'bg-purpura-500' },
                  { label: 'Papel transfer', valor: resultado.costoPapel, pct: resultado.porcentajeDesglose.papel, color: 'bg-blue-500' },
                  { label: 'Tinta', valor: resultado.costoTinta, pct: resultado.porcentajeDesglose.tinta, color: 'bg-cyan-500' },
                  { label: 'Electricidad', valor: resultado.costoElectrico, pct: resultado.porcentajeDesglose.electrico, color: 'bg-yellow-500' },
                  { label: 'Costos fijos', valor: resultado.costoFijoPieza, pct: resultado.porcentajeDesglose.fijos, color: 'bg-dorado-500' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{formatMoneda(item.valor)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(item.pct, 100)}%` }}
                      />
                    </div>
                    <p className="text-right text-[10px] text-gray-400 mt-0.5">{item.pct.toFixed(1)}%</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Guardar */}
            <div className="card">
              <h4 className="font-bold text-gray-900 dark:text-white mb-3">Guardar o Crear</h4>
              {!nombreCalc.trim() && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
                  ⚠️ Ingresa un nombre para guardar
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  id="btn-crear-producto"
                  onClick={crearComoProducto}
                  disabled={guardando || !nombreCalc.trim()}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200"
                >
                  <PlusCircle size={15} />
                  Crear Producto
                </button>
                <button
                  id="btn-guardar-calculo"
                  onClick={guardar}
                  disabled={guardando || !nombreCalc.trim() || guardado}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200
                    ${guardado
                      ? 'bg-verde-500/20 text-verde-600 dark:text-verde-400 border border-verde-500/30'
                      : 'btn-secondary'
                    }`}
                >
                  <Save size={15} />
                  {guardado ? '✓ En historial' : guardando ? 'Guardando...' : 'Guardar historial'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-verde-500/20 to-purpura-500/20 flex items-center justify-center mb-4">
              <Calculator size={28} className="text-verde-500" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">
              Ingresa los datos
            </h3>
            <p className="text-sm text-gray-500 max-w-[200px]">
              Completa el formulario y presiona &quot;Calcular precio&quot;
            </p>
            <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-white/3 w-full text-left space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Verás:</p>
              {['Precio sugerido de venta', 'Costo total detallado', 'Desglose por componente', 'Margen de ganancia real'].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-verde-500" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
