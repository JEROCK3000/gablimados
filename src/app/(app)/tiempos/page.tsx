import type { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { obtenerSesion } from '@/lib/auth/jwt'
import { redirect } from 'next/navigation'
import { Search, Thermometer } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Tiempos y Temperaturas — GABLIMADOS',
}

const categoriaColores: Record<string, string> = {
  'Textil': 'badge-verde',
  'Cerámica': 'badge-purpura',
  'Rígidos': 'badge-dorado',
  'Gorras': 'badge-verde',
  'Fundas': 'badge-purpura',
  'Madera': 'badge-dorado',
  'Metales': 'badge-purpura',
}

export default async function TiemposPage({
  searchParams,
}: {
  searchParams: Promise<{ buscar?: string; categoria?: string }>
}) {
  const sesion = await obtenerSesion()
  if (!sesion) redirect('/login')

  const params = await searchParams
  const buscar = params.buscar || ''
  const categoria = params.categoria || ''

  const productos = await prisma.productoSublimable.findMany({
    where: {
      activo: true,
      ...(buscar && {
        OR: [
          { nombre: { contains: buscar } },
          { categoria: { contains: buscar } },
        ],
      }),
      ...(categoria && { categoria }),
    },
    orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
  })

  const categorias = [...new Set(productos.map(p => p.categoria))].sort()

  const presionColor: Record<string, string> = {
    BAJA: 'text-green-500',
    MEDIA: 'text-yellow-500',
    ALTA: 'text-red-500',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white">
          Tiempos & Temperaturas 🌡️
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Base de datos de referencia para {productos.length} productos sublimables
        </p>
      </div>

      {/* Búsqueda */}
      <div className="card">
        <form className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              name="buscar"
              defaultValue={buscar}
              placeholder="Buscar producto sublimable..."
              className="input !pl-10"
            />
          </div>
          <select
            name="categoria"
            defaultValue={categoria}
            className="input w-full sm:w-56"
          >
            <option value="">Todas las categorías</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="submit" className="btn-primary px-6">Buscar</button>
        </form>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Presión baja', color: 'text-green-500', dot: 'bg-green-500' },
          { label: 'Presión media', color: 'text-yellow-500', dot: 'bg-yellow-500' },
          { label: 'Presión alta', color: 'text-red-500', dot: 'bg-red-500' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <div className={`w-2 h-2 rounded-full ${item.dot}`} />
            {item.label}
          </div>
        ))}
      </div>

      {/* Cards de productos */}
      {productos.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Thermometer size={28} className="text-gray-400 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No se encontraron productos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {productos.map((p) => (
            <div
              key={p.id}
              className="card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{p.nombre}</h3>
                <span className={categoriaColores[p.categoria] || 'badge-purpura'}>
                  {p.categoria}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">🌡️ Temperatura</span>
                  <span className="font-bold text-red-500">{p.tempC}°C</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">⏱️ Tiempo</span>
                  <span className="font-bold text-purpura-600 dark:text-purpura-400">
                    {p.tiempoSeg}s
                    <span className="text-xs font-normal text-gray-400 ml-1">
                      ({Math.floor(p.tiempoSeg / 60) > 0 ? `${Math.floor(p.tiempoSeg / 60)}m ` : ''}{p.tiempoSeg % 60}s)
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">💪 Presión</span>
                  <span className={`font-bold ${presionColor[p.presion] || 'text-gray-600'}`}>
                    {p.presion}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">🌡️ En °F</span>
                  <span className="font-medium text-gray-600 dark:text-gray-400">{p.tempF}°F</span>
                </div>
              </div>

              {p.notas && (
                <div className="mt-3 p-2 rounded-lg bg-gray-50 dark:bg-white/5 text-xs text-gray-500 dark:text-gray-400">
                  📝 {p.notas}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
