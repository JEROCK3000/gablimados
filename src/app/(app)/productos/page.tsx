import type { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { obtenerSesion } from '@/lib/auth/jwt'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Plus, Package, AlertTriangle, Search, Edit
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Productos — GABLIMADOS',
}

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ buscar?: string; categoria?: string }>
}) {
  const sesion = await obtenerSesion()
  if (!sesion) redirect('/login')

  const params = await searchParams
  const buscar = params.buscar || ''
  const catFiltro = params.categoria ? Number(params.categoria) : undefined

  const [productos, categorias] = await Promise.all([
    prisma.producto.findMany({
      where: {
        activo: true,
        ...(buscar && {
          OR: [
            { nombre: { contains: buscar } },
            { descripcion: { contains: buscar } },
          ],
        }),
        ...(catFiltro && { categoriaId: catFiltro }),
      },
      include: { categoria: true },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.categoria.findMany({ where: { activo: true }, orderBy: { orden: 'asc' } }),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">Mis Productos 📦</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {productos.length} producto{productos.length !== 1 ? 's' : ''} activo{productos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/productos/nuevo"
          id="btn-nuevo-producto"
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={17} />
          Nuevo producto
        </Link>
      </div>

      {/* Filtros */}
      <div className="card">
        <form className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              name="buscar"
              type="text"
              defaultValue={buscar}
              placeholder="Buscar producto..."
              className="input !pl-10"
            />
          </div>
          {categorias.length > 0 && (
            <select
              name="categoria"
              defaultValue={catFiltro ?? ''}
              className="input w-full sm:w-48"
            >
              <option value="">Todas las categorías</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          )}
          <button type="submit" className="btn-primary px-6">Filtrar</button>
        </form>
      </div>

      {/* Tabla de productos */}
      {productos.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
            <Package size={28} className="text-gray-400" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">
            {buscar ? 'Sin resultados' : 'Sin productos aún'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {buscar
              ? `No se encontraron productos con "${buscar}"`
              : 'Agrega tu primer producto de sublimación'}
          </p>
          {!buscar && (
            <Link href="/productos/nuevo" className="btn-primary">
              + Agregar primer producto
            </Link>
          )}
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th className="text-right">Costo total</th>
                  <th className="text-right">Precio mínimo</th>
                  <th className="text-right">Precio sugerido</th>
                  <th className="text-right">Margen</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => {
                  const margenBajo = Number(p.margen) < 20
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          {margenBajo && (
                            <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
                          )}
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{p.nombre}</p>
                            {p.descripcion && (
                              <p className="text-xs text-gray-400 truncate max-w-[200px]">{p.descripcion}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge-purpura">{p.categoria.nombre}</span>
                      </td>
                      <td className="text-right font-medium text-red-500">
                        ${Number(p.costoTotal).toFixed(2)}
                      </td>
                      <td className="text-right font-medium text-orange-500">
                        ${Number(p.precioMinimo).toFixed(2)}
                      </td>
                      <td className="text-right font-bold text-verde-600 dark:text-verde-400">
                        ${Number(p.precioSugerido).toFixed(2)}
                      </td>
                      <td className="text-right">
                        <span className={`badge-${margenBajo ? 'dorado' : 'verde'}`}>
                          {Number(p.margen).toFixed(0)}%
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/productos/${p.id}/editar`}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-purpura-500 hover:bg-purpura-500/10 transition-colors"
                            title="Editar"
                          >
                            <Edit size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
