'use client'

import { useState } from 'react'
import { ClienteForm } from './ClienteForm'
import { Plus, Search, Edit2, Mail, Phone, MapPin, Users } from 'lucide-react'

interface Cliente {
  id: number
  identificacion: string
  tipoIdentificacion: string
  nombre: string
  email: string | null
  telefono: string | null
  direccion: string | null
}

export function ClientPageContent({ clientes }: { clientes: Cliente[] }) {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)

  const filtered = clientes.filter(c => 
    c.nombre.toLowerCase().includes(search.toLowerCase()) || 
    c.identificacion.includes(search)
  )

  const openNew = () => {
    setEditingCliente(null)
    setShowForm(true)
  }

  const openEdit = (c: Cliente) => {
    setEditingCliente(c)
    setShowForm(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o RUC/Cédula..."
            className="input !pl-10"
          />
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2 justify-center">
          <Plus size={18} />
          Nuevo Cliente
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Users size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 font-medium">No se encontraron clientes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="card group hover:shadow-lg transition-all duration-200">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{c.nombre}</h3>
                  <span className="inline-block mt-1 text-xs font-semibold px-2 py-1 rounded-md bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300">
                    {c.tipoIdentificacion}: {c.identificacion}
                  </span>
                </div>
                <button 
                  onClick={() => openEdit(c)}
                  className="p-2 text-gray-400 hover:text-purpura-500 hover:bg-purpura-50 dark:hover:bg-purpura-500/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Edit2 size={16} />
                </button>
              </div>

              <div className="space-y-2 mt-4">
                {c.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Mail size={14} className="text-gray-400" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                {c.telefono && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone size={14} className="text-gray-400" />
                    <span>{c.telefono}</span>
                  </div>
                )}
                {c.direccion && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{c.direccion}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ClienteForm 
          cliente={editingCliente} 
          onClose={() => setShowForm(false)} 
        />
      )}
    </div>
  )
}
