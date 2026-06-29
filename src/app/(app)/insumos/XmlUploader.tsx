'use client'

import { useState, useRef } from 'react'
import { FileUp, X, Check, Save, Loader2, AlertTriangle } from 'lucide-react'
import { createMultipleInsumosAction } from './actions'

interface ParsedItem {
  id: string
  nombre: string
  tipo: string
  cantidadComprada: number
  costoTotal: number
  subtotal: number
  iva: number
  descuento: number
  proveedor: string
}

interface XmlUploaderProps {
  onSuccess: () => void
}

export function XmlUploader({ onSuccess }: XmlUploaderProps) {
  const [items, setItems] = useState<ParsedItem[]>([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const xmlString = event.target?.result as string
      parseXML(xmlString)
    }
    reader.readAsText(file)
    // reset input
    e.target.value = ''
  }

  const parseXML = (xmlString: string) => {
    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml')

      // Check if it's wrapped in CDATA inside <comprobante>
      let targetDoc = xmlDoc
      let detalles = targetDoc.getElementsByTagName('detalle')

      if (detalles.length === 0) {
        const comprobanteNode = xmlDoc.getElementsByTagName('comprobante')[0]
        if (comprobanteNode && comprobanteNode.textContent) {
          const innerDoc = parser.parseFromString(comprobanteNode.textContent, 'text/xml')
          if (innerDoc.getElementsByTagName('detalle').length > 0) {
            targetDoc = innerDoc
            detalles = targetDoc.getElementsByTagName('detalle')
          }
        }
      }

      // Extract Vendor
      const razonSocialNode = targetDoc.getElementsByTagName('razonSocial')[0]
      const nombreComercialNode = targetDoc.getElementsByTagName('nombreComercial')[0]
      const proveedor = (nombreComercialNode?.textContent || razonSocialNode?.textContent || 'Proveedor XML').trim()

      // Extract Items
      const newItems: ParsedItem[] = []

      for (let i = 0; i < detalles.length; i++) {
        const detalle = detalles[i]
        const descripcion = detalle.getElementsByTagName('descripcion')[0]?.textContent || 'Sin nombre'
        const cantidadStr = detalle.getElementsByTagName('cantidad')[0]?.textContent || '1'
        const precioTotalStr = detalle.getElementsByTagName('precioTotalSinImpuesto')[0]?.textContent || '0'
        const descuentoStr = detalle.getElementsByTagName('descuento')[0]?.textContent || '0'
        
        const cantidad = parseFloat(cantidadStr)
        let subtotal = parseFloat(precioTotalStr)
        let descuento = parseFloat(descuentoStr)
        
        // Sumar IVA al costo total del insumo
        let iva = 0
        const impuestos = detalle.getElementsByTagName('impuesto')
        for (let j = 0; j < impuestos.length; j++) {
          const codigo = impuestos[j].getElementsByTagName('codigo')[0]?.textContent
          if (codigo === '2') { // 2 es código de IVA en SRI Ecuador
            const valorStr = impuestos[j].getElementsByTagName('valor')[0]?.textContent || '0'
            iva += parseFloat(valorStr)
          }
        }

        const costoTotal = subtotal + iva

        newItems.push({
          id: Math.random().toString(36).substr(2, 9),
          nombre: descripcion.trim(),
          tipo: 'BLANK',
          cantidadComprada: cantidad,
          costoTotal: costoTotal,
          subtotal: subtotal,
          iva: iva,
          descuento: descuento,
          proveedor: proveedor
        })
      }

      if (newItems.length > 0) {
        setItems(newItems)
        setShowModal(true)
      } else {
        alert('No se encontraron artículos (detalles) en el XML.')
      }

    } catch (err) {
      console.error(err)
      alert('Error al leer el archivo XML. Asegúrate de que sea una factura electrónica válida.')
    }
  }

  const handleItemChange = (id: string, field: keyof ParsedItem, value: any) => {
    setItems(items.map(item => {
      if (item.id !== id) return item
      
      const updatedItem = { ...item, [field]: value }
      
      // If they manually edit costoTotal, we adjust subtotal and iva proportionally so the footer breakdown matches
      if (field === 'costoTotal') {
        const ratio = value / (item.costoTotal || 1)
        updatedItem.subtotal = item.subtotal * ratio
        updatedItem.iva = item.iva * ratio
      }
      
      return updatedItem
    }))
  }

  const handleRemove = (id: string) => {
    setItems(items.filter(item => item.id !== id))
    if (items.length === 1) setShowModal(false)
  }

  const handleSave = async () => {
    setLoading(true)
    const res = await createMultipleInsumosAction(items)
    setLoading(false)
    if (res.error) {
      alert(res.error)
    } else {
      setShowModal(false)
      onSuccess()
    }
  }

  const tiposInsumo = [
    { id: 'BLANK', label: 'Blank' },
    { id: 'PAPEL', label: 'Papel' },
    { id: 'TINTA', label: 'Tinta' },
    { id: 'EMPAQUE', label: 'Empaque' },
    { id: 'OTRO', label: 'Otro' },
  ]

  return (
    <>
      <input
        type="file"
        accept=".xml"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="btn-outline flex items-center gap-2"
      >
        <FileUp size={17} />
        <span className="hidden sm:inline">Cargar desde XML</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          
          <div className="relative bg-white dark:bg-[#1e1e32] w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl shadow-xl overflow-hidden animate-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-dorado-500/10 flex items-center justify-center text-dorado-500">
                  <FileUp size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    Revisar importación
                  </h3>
                  <p className="text-sm text-gray-500">Ajusta los nombres y cantidades antes de guardar</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              <div className="mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 text-sm flex items-start gap-3 flex-1">
                  <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Atención:</strong> Verifica que la "Cantidad" corresponda a piezas individuales. 
                    Si el proveedor factura "1 Caja de 36", cambia la cantidad a 36.
                  </p>
                </div>
                <button
                  onClick={() => setItems(items.map(item => ({ ...item, cantidadComprada: item.cantidadComprada * 2 })))}
                  className="btn-outline border-dorado-500 text-dorado-500 hover:bg-dorado-500 hover:text-white flex items-center gap-2 flex-shrink-0"
                  title="Duplica las cantidades de todos los ítems de la lista"
                >
                  <span className="font-black">2x1</span> Aplicar a Todos
                </button>
              </div>

              <div className="table-container rounded-xl border border-gray-100 dark:border-white/10">
                <table className="table w-full text-sm">
                  <thead>
                    <tr>
                      <th className="w-10"></th>
                      <th>Descripción (Nombre)</th>
                      <th className="w-32">Tipo</th>
                      <th className="w-32 text-right">Cant.</th>
                      <th className="w-28 text-right">Total ($)</th>
                      <th className="w-28 text-right">C.Unit ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const cUnit = (item.costoTotal / (item.cantidadComprada || 1)).toFixed(2)
                      return (
                        <tr key={item.id}>
                          <td className="text-center">
                            <button onClick={() => handleRemove(item.id)} className="text-red-400 hover:text-red-500" title="Eliminar de la lista">
                              <X size={14} />
                            </button>
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="w-full bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-white/10 focus:border-verde-500 rounded px-2 py-1 outline-none text-gray-900 dark:text-white transition-colors"
                              value={item.nombre}
                              onChange={e => handleItemChange(item.id, 'nombre', e.target.value)}
                            />
                          </td>
                          <td>
                            <select 
                              className="w-full bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-white/10 focus:border-verde-500 rounded px-2 py-1 outline-none text-gray-900 dark:text-white transition-colors"
                              value={item.tipo}
                              onChange={e => handleItemChange(item.id, 'tipo', e.target.value)}
                            >
                              {tiposInsumo.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                            </select>
                          </td>
                          <td>
                            <div className="flex items-center justify-end gap-1">
                              <input 
                                type="number" 
                                min="1"
                                className="w-16 bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-white/10 focus:border-verde-500 rounded px-1 py-1 outline-none text-right font-medium text-gray-900 dark:text-white transition-colors"
                                value={item.cantidadComprada}
                                onChange={e => handleItemChange(item.id, 'cantidadComprada', parseFloat(e.target.value) || 0)}
                              />
                              <button 
                                onClick={() => handleItemChange(item.id, 'cantidadComprada', item.cantidadComprada * 2)}
                                className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-xs font-bold hover:bg-dorado-500 hover:text-white transition-colors text-gray-500 dark:text-gray-400"
                                title="Aplicar promoción 2x1"
                              >
                                2x1
                              </button>
                            </div>
                          </td>
                          <td>
                            <input 
                              type="number" 
                              min="0" step="0.01"
                              className="w-full bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-white/10 focus:border-verde-500 rounded px-2 py-1 outline-none text-right font-medium text-red-500 transition-colors"
                              value={item.costoTotal}
                              onChange={e => handleItemChange(item.id, 'costoTotal', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td className="text-right font-bold text-verde-500 px-2">
                            ${cUnit}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 flex items-center justify-between flex-shrink-0">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-start sm:items-center">
                <span className="text-sm font-medium text-gray-500 whitespace-nowrap">
                  {items.length} artículo{items.length !== 1 ? 's' : ''}
                </span>
                <div className="flex gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex flex-col">
                    <span>Subtotal: <span className="font-medium">${items.reduce((acc, item) => acc + item.subtotal, 0).toFixed(2)}</span></span>
                    {items.some(i => i.descuento > 0) && (
                      <span className="text-dorado-500">Descuento: <span className="font-medium">-${items.reduce((acc, item) => acc + item.descuento, 0).toFixed(2)}</span></span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span>IVA: <span className="font-medium">${items.reduce((acc, item) => acc + item.iva, 0).toFixed(2)}</span></span>
                    <span className="font-black text-verde-500 text-sm sm:text-base">
                      TOTAL: ${items.reduce((acc, item) => acc + item.costoTotal, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)} className="btn-ghost hidden sm:block">
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={loading} className="btn-primary">
                  {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
