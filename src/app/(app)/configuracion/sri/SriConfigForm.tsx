'use client'

import { useState } from 'react'
import { guardarConfiguracionSRIAction } from './actions'
import { Save, Loader2, FileKey } from 'lucide-react'

interface Props {
  config: {
    ruc: string
    razonSocial: string
    nombreComercial: string
    dirMatriz: string
    dirEstablecimiento: string
    codigoEstablecimiento: string
    codigoPuntoEmision: string
    obligadoContabilidad: boolean
    ambiente: number
    passwordFirma: string
    rutaFirma: string
    contribuyenteEspecial: string
    agenteRetencion: string
    ecuadorApiToken?: string
  } | null
}

export function SriConfigForm({ config }: Props) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    ruc: config?.ruc ?? '',
    razonSocial: config?.razonSocial ?? '',
    nombreComercial: config?.nombreComercial ?? '',
    dirMatriz: config?.dirMatriz ?? '',
    dirEstablecimiento: config?.dirEstablecimiento ?? '',
    codigoEstablecimiento: config?.codigoEstablecimiento ?? '001',
    codigoPuntoEmision: config?.codigoPuntoEmision ?? '001',
    obligadoContabilidad: config?.obligadoContabilidad ?? false,
    ambiente: config?.ambiente ?? 1,
    passwordFirma: config?.passwordFirma ?? '',
    contribuyenteEspecial: config?.contribuyenteEspecial ?? '',
    agenteRetencion: config?.agenteRetencion ?? '',
    ecuadorApiToken: config?.ecuadorApiToken ?? ''
  })
  
  const [firma, setFirma] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const formData = new FormData()
      formData.append('ruc', form.ruc)
      formData.append('razonSocial', form.razonSocial)
      formData.append('nombreComercial', form.nombreComercial)
      formData.append('dirMatriz', form.dirMatriz)
      formData.append('dirEstablecimiento', form.dirEstablecimiento)
      formData.append('codigoEstablecimiento', form.codigoEstablecimiento)
      formData.append('codigoPuntoEmision', form.codigoPuntoEmision)
      formData.append('obligadoContabilidad', String(form.obligadoContabilidad))
      formData.append('ambiente', String(form.ambiente))
      formData.append('passwordFirma', form.passwordFirma)
      formData.append('contribuyenteEspecial', form.contribuyenteEspecial)
      formData.append('agenteRetencion', form.agenteRetencion)
      formData.append('ecuadorApiToken', form.ecuadorApiToken)
      
      if (firma) {
        formData.append('firma', firma)
      }

      await guardarConfiguracionSRIAction(formData)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Error al guardar configuración')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card space-y-4">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FileKey className="text-purpura-500" size={20} />
          Firma Electrónica (.p12)
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Archivo de Firma (.p12) *</label>
            <input
              type="file"
              accept=".p12"
              onChange={e => setFirma(e.target.files?.[0] ?? null)}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-purpura-50 file:text-purpura-700 hover:file:bg-purpura-100 dark:file:bg-white/5 dark:file:text-white w-full text-sm text-gray-500"
              required={!config}
            />
            {config && (
              <p className="text-xs text-gray-400 mt-1">
                ✓ Firma cargada anteriormente. Sube una nueva para reemplazarla.
              </p>
            )}
          </div>
          <div>
            <label className="label">Contraseña de la Firma *</label>
            <input
              type="password"
              value={form.passwordFirma}
              onChange={e => setForm(f => ({ ...f, passwordFirma: e.target.value }))}
              placeholder="Contraseña del certificado .p12"
              className="input"
              required
            />
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <h3 className="font-bold text-gray-900 dark:text-white">Datos Generales del Emisor</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">RUC del Emisor *</label>
            <input
              type="text"
              maxLength={13}
              value={form.ruc}
              onChange={e => setForm(f => ({ ...f, ruc: e.target.value }))}
              placeholder="17xxxxxxxx001"
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Ambiente de Operación *</label>
            <select
              value={form.ambiente}
              onChange={e => setForm(f => ({ ...f, ambiente: Number(e.target.value) }))}
              className="input"
            >
              <option value={1}>Pruebas (Ambiente 1)</option>
              <option value={2}>Producción (Ambiente 2)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Razón Social *</label>
            <input
              type="text"
              value={form.razonSocial}
              onChange={e => setForm(f => ({ ...f, razonSocial: e.target.value }))}
              placeholder="Ej: Juan Fernando Pérez Cueva"
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Nombre Comercial</label>
            <input
              type="text"
              value={form.nombreComercial}
              onChange={e => setForm(f => ({ ...f, nombreComercial: e.target.value }))}
              placeholder="Ej: Gablimados"
              className="input"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Código Establecimiento *</label>
            <input
              type="text"
              maxLength={3}
              value={form.codigoEstablecimiento}
              onChange={e => setForm(f => ({ ...f, codigoEstablecimiento: e.target.value }))}
              placeholder="001"
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Punto de Emisión *</label>
            <input
              type="text"
              maxLength={3}
              value={form.codigoPuntoEmision}
              onChange={e => setForm(f => ({ ...f, codigoPuntoEmision: e.target.value }))}
              placeholder="001"
              className="input"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Contribuyente Especial (Nro. Resolución)</label>
            <input
              type="text"
              value={form.contribuyenteEspecial}
              onChange={e => setForm(f => ({ ...f, contribuyenteEspecial: e.target.value }))}
              placeholder="Ej: 5368 (Dejar vacío si no aplica)"
              className="input"
            />
          </div>
          <div>
            <label className="label">Agente de Retención (Nro. Resolución)</label>
            <input
              type="text"
              value={form.agenteRetencion}
              onChange={e => setForm(f => ({ ...f, agenteRetencion: e.target.value }))}
              placeholder="Ej: 1 (Dejar vacío si no aplica)"
              className="input"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 py-2">
          <input
            type="checkbox"
            id="obligadoContabilidad"
            checked={form.obligadoContabilidad}
            onChange={e => setForm(f => ({ ...f, obligadoContabilidad: e.target.checked }))}
            className="w-4 h-4 text-verde-500 border-gray-300 rounded focus:ring-verde-500"
          />
          <label htmlFor="obligadoContabilidad" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Obligado a llevar contabilidad
          </label>
        </div>

        <div>
          <label className="label">Dirección Matriz *</label>
          <textarea
            value={form.dirMatriz}
            onChange={e => setForm(f => ({ ...f, dirMatriz: e.target.value }))}
            rows={2}
            className="input resize-none"
            placeholder="Matriz..."
            required
          />
        </div>

        <div>
          <label className="label">Dirección Establecimiento *</label>
          <textarea
            value={form.dirEstablecimiento}
            onChange={e => setForm(f => ({ ...f, dirEstablecimiento: e.target.value }))}
            rows={2}
            className="input resize-none"
            placeholder="Establecimiento..."
            required
          />
        </div>
      </div>

      <div className="card border border-white/5 bg-[#0f0f23]/60 space-y-4">
        <h3 className="font-bold text-white flex items-center gap-2 text-sm border-b border-white/5 pb-2">
          🔌 Integraciones de Consulta
        </h3>
        <div>
          <label className="label">Token de EcuadorAPI (Consulta Cédula/RUC)</label>
          <input
            type="password"
            value={form.ecuadorApiToken}
            onChange={e => setForm(f => ({ ...f, ecuadorApiToken: e.target.value }))}
            placeholder="ecu_..."
            className="input font-mono text-xs"
          />
          <p className="text-[10px] text-gray-400 mt-1">
            Token de acceso obtenido desde <a href="https://ecuadorapi.com" target="_blank" rel="noopener noreferrer" className="text-verde-500 hover:underline">ecuadorapi.com</a> para autocompletar clientes con un solo clic.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-xl bg-verde-50 dark:bg-verde-500/10 border border-verde-200 dark:border-verde-500/20 text-verde-600 dark:text-verde-400 text-sm">
          ✅ Configuración SRI y firma guardados exitosamente
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {loading ? 'Guardando...' : 'Guardar Configuración SRI'}
      </button>
    </form>
  )
}
