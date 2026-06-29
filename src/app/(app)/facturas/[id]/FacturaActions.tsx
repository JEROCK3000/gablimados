'use client'

import { FileText, Download, Mail } from 'lucide-react'
import { generarRidePDF } from '@/lib/reports/ride'
import { toast } from 'sonner'
import { enviarFacturaEmailAction } from '../../pedidos/sri-actions'

interface Props {
  pedido: any
  emisor: any
  factura: any
}

export function FacturaActions({ pedido, emisor, factura }: Props) {
  const isAutorizada = factura.estado === 'AUTORIZADA'
  
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

  if (!isAutorizada) return null

  const handleRegenerar = async () => {
    toast.promise(
      generarRidePDF(pedido, emisor, factura),
      {
        loading: 'Cargando logotipo y regenerando RIDE (PDF)...',
        success: '¡PDF RIDE regenerado y descargado con éxito!',
        error: 'Error al generar el RIDE'
      }
    )
  }

  const handleEnviarEmail = async () => {
    if (!pedido.cliente.email) {
      toast.error('El cliente no tiene un correo electrónico registrado.')
      return
    }

    const sendPromise = (async () => {
      const doc = await generarRidePDF(pedido, emisor, factura, false)
      const dataUrl = doc.output('datauristring')
      const base64 = dataUrl.split(',')[1]
      return enviarFacturaEmailAction(factura.pedidoId || pedido.id, base64)
    })()

    toast.promise(sendPromise, {
      loading: `Enviando factura por correo a ${pedido.cliente.email}...`,
      success: '¡Factura enviada con éxito por correo!',
      error: (err) => err.message || 'Error al enviar la factura por correo'
    })
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={handleEnviarEmail}
        disabled={!pedido.cliente.email}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
          pedido.cliente.email
            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/10'
            : 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
        }`}
        title={pedido.cliente.email ? `Enviar por correo a ${pedido.cliente.email}` : 'Cliente sin correo registrado'}
      >
        <Mail size={16} />
        Enviar por Correo
      </button>

      <button
        onClick={handleRegenerar}
        className="flex items-center gap-2 px-4 py-2 bg-purpura-600 hover:bg-purpura-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purpura-500/10 cursor-pointer"
      >
        <FileText size={16} />
        Regenerar RIDE (PDF)
      </button>

      {factura.xmlFirmado && (
        <button
          onClick={() => downloadXml(factura.xmlFirmado, pedido.numero)}
          className="flex items-center gap-2 px-4 py-2 border border-white/10 hover:bg-white/5 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer bg-[#0f0f23]/40"
        >
          <Download size={16} />
          Descargar XML
        </button>
      )}
    </div>
  )
}
