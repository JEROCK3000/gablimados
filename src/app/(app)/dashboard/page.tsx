import { obtenerSesion } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import {
  Calculator,
  Package,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Thermometer,
  FileBarChart,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'

import { DashboardCharts } from './DashboardCharts'

export const metadata: Metadata = {
  title: 'Dashboard — GABLIMADOS',
}

export default async function DashboardPage() {
  const sesion = await obtenerSesion()
  if (!sesion) redirect('/login')

  // Métricas
  const [totalProductos, totalCalculos, productosActivos] = await Promise.all([
    prisma.producto.count(),
    prisma.calculo.count(),
    prisma.producto.count({ where: { activo: true } }),
  ])

  // Productos con margen bajo (< 20%)
  const productosMargeBajo = await prisma.producto.count({
    where: { activo: true, margen: { lt: 20 } },
  })

  // Últimos cálculos
  const ultimosCalculos = await prisma.calculo.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { producto: true },
  })

  // Costos fijos del mes actual
  const ahora = new Date()
  const costosMes = await prisma.costoFijo.findFirst({
    where: { mes: ahora.getMonth() + 1, anio: ahora.getFullYear() },
  })

  const totalCostosFijos = costosMes
    ? Number(costosMes.alquiler) + Number(costosMes.electricidad) +
      Number(costosMes.salarios) + Number(costosMes.internet) +
      Number(costosMes.agua) + Number(costosMes.transporte) + Number(costosMes.otros)
    : 0

  // ─── Ventas de este mes ──────────────────────────────────────────────────────
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999)
  
  const pedidosEsteMes = await prisma.pedido.aggregate({
    where: {
      createdAt: {
        gte: inicioMes,
        lte: finMes
      }
    },
    _sum: {
      total: true
    }
  })
  const totalVentasMes = Number(pedidosEsteMes._sum.total || 0)

  // ─── Tendencias y Gráficos del Año Actual ────────────────────────────────────
  const anioActual = ahora.getFullYear()
  const pedidosEsteAnio = await prisma.pedido.findMany({
    where: {
      createdAt: {
        gte: new Date(`${anioActual}-01-01T00:00:00.000Z`),
        lte: new Date(`${anioActual}-12-31T23:59:59.999Z`),
      }
    },
    select: {
      total: true,
      formaPago: true,
      createdAt: true
    }
  })

  // Agrupar por mes
  const mesesAbrevia = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const datosMensuales = mesesAbrevia.map((mes, idx) => {
    const totalMes = pedidosEsteAnio
      .filter(p => p.createdAt.getMonth() === idx)
      .reduce((s, p) => s + Number(p.total), 0)
    return { name: mes, Ventas: Number(totalMes.toFixed(2)) }
  })

  // Agrupar por método de pago
  const pagoNombres: Record<string, string> = {
    '01': 'Efectivo',
    '16': 'T. Débito',
    '19': 'T. Crédito',
    '20': 'Transferencia'
  }
  const metodosAgrupados: Record<string, number> = {}
  pedidosEsteAnio.forEach(p => {
    const nombre = pagoNombres[p.formaPago] || 'Otros'
    metodosAgrupados[nombre] = (metodosAgrupados[nombre] || 0) + Number(p.total)
  })

  const datosMetodosPago = Object.entries(metodosAgrupados).map(([name, value]) => ({
    name,
    value: Number(value.toFixed(2))
  }))

  return (
    <div className="space-y-6">
      {/* Saludo */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">
            ¡Hola, {sesion.nombre.split(' ')[0]}! 👋
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {new Date().toLocaleDateString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link href="/calculadora" className="btn-primary flex items-center gap-2">
          <Calculator size={16} />
          <span className="hidden sm:inline">Nuevo cálculo</span>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          titulo="Ventas del mes"
          valor={`$${totalVentasMes.toLocaleString('es', { minimumFractionDigits: 2 })}`}
          icono={<TrendingUp size={22} />}
          color="verde"
          descripcion="Facturación mes actual"
          href="/reportes"
        />
        <StatCard
          titulo="Productos activos"
          valor={String(productosActivos)}
          icono={<Package size={22} />}
          color="purpura"
          descripcion={`${totalProductos} en total`}
          href="/productos"
        />
        <StatCard
          titulo="Cálculos realizados"
          valor={String(totalCalculos)}
          icono={<Calculator size={22} />}
          color="dorado"
          descripcion="Histórico total"
          href="/calculadora"
        />
        <StatCard
          titulo="Costos fijos/mes"
          valor={`$${totalCostosFijos.toLocaleString('es', { minimumFractionDigits: 2 })}`}
          icono={<BarChart3 size={22} />}
          color="rojo"
          descripcion="Gastos fijos"
          href="/configuracion"
        />
      </div>

      {/* Gráficos del Dashboard */}
      <DashboardCharts datosMensuales={datosMensuales} datosMetodosPago={datosMetodosPago} />

      {/* Accesos rápidos + Últimos cálculos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accesos rápidos */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-dorado-400" />
            <h3 className="font-bold text-gray-900 dark:text-white">Accesos rápidos</h3>
          </div>
          <div className="space-y-2">
            {[
              { href: '/calculadora', label: 'Calcular nuevo producto', icon: Calculator, color: 'text-verde-500' },
              { href: '/productos', label: 'Ver mi catálogo', icon: Package, color: 'text-purpura-500' },
              { href: '/tiempos', label: 'Tiempos y temperaturas', icon: Thermometer, color: 'text-dorado-500' },
              { href: '/reportes', label: 'Generar reporte', icon: FileBarChart, color: 'text-blue-500' },
              { href: '/configuracion', label: 'Configurar costos fijos', icon: TrendingUp, color: 'text-gray-500' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                >
                  <Icon size={17} className={item.color} />
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium group-hover:text-verde-600 dark:group-hover:text-verde-400 transition-colors">
                    {item.label}
                  </span>
                  <ArrowRight size={14} className="ml-auto text-gray-400 group-hover:text-verde-500 transition-all group-hover:translate-x-0.5" />
                </Link>
              )
            })}
          </div>
        </div>

        {/* Últimos cálculos */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white">Últimos cálculos</h3>
            <Link href="/calculadora" className="text-xs text-verde-500 hover:text-verde-600 font-medium">
              Ver todos →
            </Link>
          </div>

          {ultimosCalculos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
                <Calculator size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Sin cálculos aún</p>
              <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">Realiza tu primer cálculo</p>
              <Link href="/calculadora" className="btn-primary mt-4 text-sm py-2 px-4">
                Calcular ahora
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {ultimosCalculos.map((calculo) => {
                const resultado = calculo.resultado as { precioSugerido?: number }
                return (
                  <div
                    key={calculo.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/3 hover:bg-gray-100 dark:hover:bg-white/6 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-verde-500/20 to-purpura-500/20 flex items-center justify-center flex-shrink-0">
                      <Calculator size={15} className="text-verde-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {calculo.nombreCalc}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(calculo.createdAt).toLocaleDateString('es')}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-verde-600 dark:text-verde-400">
                        ${resultado?.precioSugerido?.toFixed(2) || '—'}
                      </p>
                      <p className="text-xs text-gray-500">precio sugerido</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Aviso configuración si no hay costos fijos */}
      {!costosMes && (
        <div className="card border-dorado-400/30 bg-dorado-50 dark:bg-dorado-400/5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-dorado-400/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-dorado-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-dorado-700 dark:text-dorado-400 mb-1">
                Configura tus costos fijos
              </h4>
              <p className="text-sm text-dorado-600 dark:text-dorado-300/70">
                Para calcular precios precisos, primero ingresa los costos fijos de tu negocio (alquiler, electricidad, etc.)
              </p>
            </div>
            <Link href="/configuracion" className="btn-outline border-dorado-400 text-dorado-600 dark:text-dorado-400 hover:bg-dorado-400 hover:text-white text-sm py-2">
              Configurar
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Componente StatCard ───────────────────────────────────────────────────────
function StatCard({
  titulo,
  valor,
  icono,
  color,
  descripcion,
  href,
}: {
  titulo: string
  valor: string
  icono: React.ReactNode
  color: 'verde' | 'purpura' | 'dorado' | 'rojo'
  descripcion: string
  href: string
}) {
  const colorMap = {
    verde:   { bg: 'bg-verde-500/10 dark:bg-verde-500/15', text: 'text-verde-600 dark:text-verde-400', border: 'border-verde-500/20' },
    purpura: { bg: 'bg-purpura-500/10 dark:bg-purpura-500/15', text: 'text-purpura-600 dark:text-purpura-400', border: 'border-purpura-500/20' },
    dorado:  { bg: 'bg-dorado-400/10 dark:bg-dorado-400/15', text: 'text-dorado-600 dark:text-dorado-400', border: 'border-dorado-400/20' },
    rojo:    { bg: 'bg-red-500/10 dark:bg-red-500/15', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/20' },
  }

  const c = colorMap[color]

  return (
    <Link href={href} className="card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer block">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">{titulo}</p>
          <p className={`text-2xl font-black ${c.text}`}>{valor}</p>
          <p className="text-xs text-gray-400 mt-1">{descripcion}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl ${c.bg} ${c.text} flex items-center justify-center flex-shrink-0`}>
          {icono}
        </div>
      </div>
    </Link>
  )
}
