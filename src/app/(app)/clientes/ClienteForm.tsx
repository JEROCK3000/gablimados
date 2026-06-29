'use client'

import { useState } from 'react'
import { Save, Loader2, X } from 'lucide-react'
import { crearClienteAction, actualizarClienteAction } from './actions'

interface Props {
  cliente?: {
    id: number
    identificacion: string
    tipoIdentificacion: string
    nombre: string
    email: string | null
    telefono: string | null
    direccion: string | null
  } | null
  onClose: () => void
}

export function ClienteForm({ cliente, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    identificacion: cliente?.identificacion ?? '',
    tipoIdentificacion: cliente?.tipoIdentificacion ?? 'CEDULA',
    nombre: cliente?.nombre ?? '',
    email: cliente?.email ?? '',
    telefono: cliente?.telefono ?? '',
    direccion: cliente?.direccion ?? '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.identificacion.trim() || !form.nombre.trim()) {
      setError('Identificación y Nombre son obligatorios')
      return
    }

    setLoading(true)
    setError('')
    try {
      if (cliente) {
        await actualizarClienteAction(cliente.id, form)
      } else {
        await crearClienteAction(form)
      }
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTipoChange = (tipo: string) => {
    setForm(f => {
      const updated = { ...f, tipoIdentificacion: tipo }
      if (tipo === 'CONSUMIDOR_FINAL') {
        updated.identificacion = '9999999999999'
        updated.nombre = 'CONSUMIDOR FINAL'
      } else if (f.tipoIdentificacion === 'CONSUMIDOR_FINAL') {
        updated.identificacion = ''
        updated.nombre = ''
      }
      return updated
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-white/10 flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 rounded-t-2xl z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <form id="cliente-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Tipo</label>
                <select
                  value={form.tipoIdentificacion}
                  onChange={e => handleTipoChange(e.target.value)}
                  className="input"
                >
                  <option value="CEDULA">Cédula</option>
                  <option value="RUC">RUC</option>
                  <option value="PASAPORTE">Pasaporte</option>
                  <option value="CONSUMIDOR_FINAL">Consumidor Final</option>
                </select>
              </div>
              <div>
                <label className="label">Identificación *</label>
                <input
                  type="text"
                  value={form.identificacion}
                  onChange={e => setForm(f => ({ ...f, identificacion: e.target.value }))}
                  className="input disabled:opacity-60 disabled:bg-gray-100 dark:disabled:bg-white/5"
                  placeholder="0912345678"
                  required
                  disabled={form.tipoIdentificacion === 'CONSUMIDOR_FINAL'}
                />
              </div>
            </div>

            <div>
              <label className="label">Razón Social / Nombre *</label>
              <input
                type="text"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                className="input disabled:opacity-60 disabled:bg-gray-100 dark:disabled:bg-white/5"
                placeholder="Ej: Juan Pérez o Empresa S.A."
                required
                disabled={form.tipoIdentificacion === 'CONSUMIDOR_FINAL'}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Teléfono</label>
                <input
                  type="text"
                  value={form.telefono}
                  onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                  className="input"
                  placeholder="099..."
                />
              </div>
              <div>
                <label className="label">Correo Electrónico</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input"
                  placeholder="juan@email.com"
                />
              </div>
            </div>

            <div>
              <label className="label">Dirección</label>
              <textarea
                value={form.direccion}
                onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
                className="input resize-none"
                rows={2}
                placeholder="Av. Principal y Secundaria..."
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                ⚠️ {error}
              </div>
            )}
          </form>
        </div>

        <div className="p-5 border-t border-gray-100 dark:border-white/10 flex gap-3 bg-gray-50 dark:bg-white/5 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost flex-1"
          >
            Cancelar
          </button>
          <button
            form="cliente-form"
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {loading ? 'Guardando...' : 'Guardar Cliente'}
          </button>
        </div>
      </div>
    </div>
  )
}
