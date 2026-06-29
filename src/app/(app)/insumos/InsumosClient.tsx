'use client'

import { useState } from 'react'
import { Plus, Package, Edit, Trash2, Search, Store } from 'lucide-react'
import { InsumoForm } from './InsumoForm'
import { deleteInsumoAction } from './actions'
import { XmlUploader } from './XmlUploader'

interface Insumo {
  id: number
  nombre: string
  tipo: string
  cantidadComprada: number
  costoTotal: number
  costoUnitario: number
  proveedor: string | null
  stockActual: number
}

interface InsumosClientProps {
  insumos: Insumo[]
}

const tipoColores: Record<string, string> = {
  BLANK: 'badge-dorado',
  PAPEL: 'badge-purpura',
  TINTA: 'badge-verde',
  EMPAQUE: 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300 rounded-full px-2 py-0.5 text-xs font-medium',
  OTRO: 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300 rounded-full px-2 py-0.5 text-xs font-medium'
}

export function InsumosClient({ insumos }: InsumosClientProps) {
  const [buscar, setBuscar] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [insumoEdit, setInsumoEdit] = useState<Insumo | undefined>()

  const filtered = insumos.filter(i => {
    const matchBusqueda = i.nombre.toLowerCase().includes(buscar.toLowerCase()) || 
                          (i.proveedor && i.proveedor.toLowerCase().includes(buscar.toLowerCase()))
    const matchTipo = tipoFiltro ? i.tipo === tipoFiltro : true
    return matchBusqueda && matchTipo
  })

  const handleEdit = (insumo: Insumo) => {
    setInsumoEdit(insumo)
    setFormOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este insumo?')) {
      await deleteInsumoAction(id)
    }
  }

  const abrirNuevo = () => {
    setInsumoEdit(undefined)
    setFormOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">Inventario e Insumos 📦</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Registra tus compras y obtén costos unitarios reales
          </p>
        </div>
        <div className="flex items-center gap-3">
          <XmlUploader onSuccess={() => {}} />
          <button
            onClick={abrirNuevo}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={17} />
            Registrar Compra
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar insumo o proveedor..."
              className="input !pl-10"
              value={buscar}
              onChange={e => setBuscar(e.target.value)}
            />
          </div>
          <select
            className="input w-full sm:w-48"
            value={tipoFiltro}
            onChange={e => setTipoFiltro(e.target.value)}
          >
            <option value="">Todos los tipos</option>
            <option value="BLANK">Productos (Blanks)</option>
            <option value="PAPEL">Papel</option>
            <option value="TINTA">Tinta</option>
            <option value="EMPAQUE">Empaques</option>
            <option value="OTRO">Otros</option>
          </select>
        </div>
      </div>

      {/* Grid de Insumos */}
      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
            <Package size={28} className="text-gray-400" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">
            {buscar ? 'Sin resultados' : 'Tu inventario está vacío'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Registra tu primera compra para empezar a costear correctamente.
          </p>
          {!buscar && (
            <button onClick={abrirNuevo} className="btn-primary">
              + Registrar primer insumo
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(insumo => (
            <div key={insumo.id} className="card p-0 overflow-hidden flex flex-col">
              <div className="p-4 flex-1">
                <div className="flex justify-between items-start mb-2">
                  <span className={tipoColores[insumo.tipo] || tipoColores['OTRO']}>
                    {insumo.tipo}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(insumo)}
                      className="text-gray-400 hover:text-purpura-500 transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(insumo.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1 leading-tight">
                  {insumo.nombre}
                </h3>
                
                {insumo.proveedor && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
                    <Store size={12} />
                    <span>{insumo.proveedor}</span>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-y-3 mt-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Costo Lote</p>
                    <p className="font-medium">${Number(insumo.costoTotal).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Unidades</p>
                    <p className="font-medium">{insumo.cantidadComprada} u.</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Stock</p>
                    <p className={`font-bold ${insumo.stockActual <= 5 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                      {insumo.stockActual} u.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-white/5 p-4 border-t border-gray-100 dark:border-white/10 flex justify-between items-center">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Costo Unitario</span>
                <span className="text-xl font-black text-verde-500">
                  ${Number(insumo.costoUnitario).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <InsumoForm
          insumoInicial={insumoEdit}
          onClose={() => setFormOpen(false)}
        />
      )}
    </div>
  )
}
