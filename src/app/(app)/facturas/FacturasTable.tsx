'use client'

import { useState } from 'react'
import { FileText, Download, AlertCircle, Clock, CheckCircle, Search, RefreshCw, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { generarRidePDF } from '@/lib/reports/ride'
import { emitirFacturaSRIAction } from '../pedidos/sri-actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Props {
  facturas: any[]
  emisor: any
}

export function FacturasTable({ facturas, emisor }: Props) {
  const router = useRouter()
  const [filter, setFilter] = useState<'TODAS' | 'AUTORIZADA' | 'PENDIENTE' | 'RECHAZADA'>('TODAS')
  const [search, setSearch] = useState('')
  const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({})
  const handleConsultar = async (pedidoId: number) => {
    setLoadingMap(prev => ({ ...prev, [pedidoId]: true }))
    const queryPromise = emitirFacturaSRIAction(pedidoId)

    toast.promise(
      queryPromise,
      {
        loading: 'Consultando estado del comprobante en el SRI...',
        success: (res) => {
          router.refresh()
          return `¡Comprobante autorizado con éxito! Nº: ${res.numeroAutorizacion}`
        },
        error: (err) => err.message || 'Error al consultar estado en el SRI',
      }
    )

    try {
      await queryPromise
    } catch (err) {
      // toast.promise already handles error display
    } finally {
      setLoadingMap(prev => ({ ...prev, [pedidoId]: false }))
    }
  }

  const downloadXml = (xmlContent: string, num: string) => {
    const blob = new Blob([xmlContent], { type: 'text/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `FACTURA-${num}.xml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const filtered = facturas.filter(f => {
    const matchesFilter = filter === 'TODAS' || f.estado === filter
    const matchesSearch = 
      f.pedido.numero.toLowerCase().includes(search.toLowerCase()) ||
      f.pedido.cliente.nombre.toLowerCase().includes(search.toLowerCase()) ||
      f.pedido.cliente.identificacion.includes(search) ||
      f.claveAcceso.includes(search)

    return matchesFilter && matchesSearch
  })

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex bg-[#0f0f23]/60 dark:bg-white/5 p-1 rounded-xl w-full sm:w-auto border border-white/5">
          {(['TODAS', 'AUTORIZADA', 'PENDIENTE', 'RECHAZADA'] as const).map(opt => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === opt
                  ? 'bg-purpura-500/20 text-purpura-400 border border-purpura-500/30 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por cliente, RUC, número..."
            className="input pl-9"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-x-auto p-0 border border-white/5">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-gray-400 text-xs font-bold uppercase bg-[#0e0e1e]/60">
              <th className="p-4">Pedido / Fecha</th>
              <th className="p-4">Nº Factura</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Clave de Acceso</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-right">Total</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  No se encontraron comprobantes emitidos.
                </td>
              </tr>
            ) : (
              filtered.map(f => {
                const isAutorizada = f.estado === 'AUTORIZADA'
                const isPendiente = f.estado === 'PENDIENTE'
                const isRechazada = f.estado === 'RECHAZADA'
                const loading = loadingMap[f.pedidoId]

                const estab = f.claveAcceso.substring(24, 27)
                const ptoEmi = f.claveAcceso.substring(27, 30)
                const secuencial = f.claveAcceso.substring(30, 39)
                const facturaNumero = `${estab}-${ptoEmi}-${secuencial}`

                return (
                  <tr key={f.id} className="hover:bg-white/1">
                    <td className="p-4">
                      <div className="font-bold text-white">
                        <Link href={`/facturas/${f.id}`} className="hover:text-purpura-400 hover:underline">
                          {f.pedido.numero}
                        </Link>
                      </div>
                      <span className="text-xs text-gray-500">{f.createdAt}</span>
                    </td>
                    <td className="p-4 font-mono font-semibold text-white">
                      {facturaNumero}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-white">
                        {f.pedido.cliente.nombre}
                      </div>
                      <span className="text-xs text-gray-400">{f.pedido.cliente.identificacion}</span>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-gray-400 max-w-[200px] truncate" title={f.claveAcceso}>
                      {f.claveAcceso}
                    </td>
                    <td className="p-4">
                      {isAutorizada && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                          <CheckCircle size={12} /> Autorizada
                        </span>
                      )}
                      {isPendiente && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock size={12} className="animate-pulse" /> Pendiente
                        </span>
                      )}
                      {isRechazada && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20" title={f.mensajeError || ''}>
                          <AlertCircle size={12} /> Rechazada
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right font-black text-white">
                      ${f.pedido.total.toFixed(2)}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-center">
                        {isAutorizada ? (
                          <>
                            <button
                              onClick={() => generarRidePDF(f.pedido, emisor, f)}
                              className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-purpura-400 rounded-lg transition-colors border border-white/5"
                              title="Descargar PDF RIDE"
                            >
                              <FileText size={16} />
                            </button>
                            {f.xmlFirmado && (
                              <button
                                onClick={() => downloadXml(f.xmlFirmado, f.pedido.numero)}
                                className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-purpura-400 rounded-lg transition-colors border border-white/5"
                                title="Descargar XML"
                              >
                                <Download size={16} />
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => handleConsultar(f.pedidoId)}
                            disabled={loading}
                            className="flex items-center gap-1 px-3 py-1 bg-purpura-500/10 text-purpura-400 border border-purpura-500/20 hover:bg-purpura-500/20 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                            title={isPendiente ? 'Consultar SRI' : 'Reintentar'}
                          >
                            {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                            {isPendiente ? 'Consultar SRI' : 'Reintentar'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
