import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function generarRidePDF(pedido: any, emisor: any, factura: any, descargar = true) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // Cargar logo de forma asíncrona
  try {
    await new Promise((resolve) => {
      const img = new Image()
      img.src = '/logo.jpg'
      img.onload = () => {
        doc.addImage(img, 'JPEG', 10, 10, 32, 32)
        resolve(null)
      }
      img.onerror = () => {
        console.warn('No se pudo cargar el logo para el RIDE')
        resolve(null)
      }
    })
  } catch (err) {
    console.error('Error al cargar logo:', err)
  }

  doc.setFont('helvetica', 'normal')

  // Left column (Emisor con Logo a la izquierda)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(emisor.nombreComercial || emisor.razonSocial, 45, 15, { maxWidth: 45 })
  
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.text(`Razón Social: ${emisor.razonSocial}`, 45, 23, { maxWidth: 45 })
  doc.text(`Dirección Matriz: ${emisor.dirMatriz}`, 45, 29, { maxWidth: 45 })
  doc.text(`Dirección Sucursal: ${emisor.dirEstablecimiento}`, 45, 39, { maxWidth: 45 })
  
  doc.setFontSize(8)
  doc.text(`Obligado a llevar contabilidad: ${emisor.obligadoContabilidad ? 'SÍ' : 'NO'}`, 10, 48)
  if (emisor.contribuyenteEspecial) {
    doc.text(`Contribuyente Especial Nro: ${emisor.contribuyenteEspecial}`, 10, 52)
  }
  if (emisor.agenteRetencion) {
    doc.text(`Agente de Retención Nro: ${emisor.agenteRetencion}`, 10, 56)
  }

  // Right column (Factura metadata)
  doc.setDrawColor(200, 200, 200)
  doc.rect(95, 10, 105, 55)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(`R.U.C.: ${emisor.ruc}`, 100, 15)
  doc.text(`FACTURA`, 100, 22)
  doc.setFont('helvetica', 'normal')
  doc.text(`No.: ${emisor.codigoEstablecimiento}-${emisor.codigoPuntoEmision}-${pedido.numero.replace('PED-', '')}`, 100, 27)
  doc.text(`NÚMERO DE AUTORIZACIÓN:`, 100, 32)
  doc.setFontSize(8)
  doc.text(factura.numeroAutorizacion || 'PENDIENTE', 100, 36, { maxWidth: 95 })
  doc.setFontSize(9)
  doc.text(`FECHA Y HORA DE AUTORIZACIÓN: ${factura.fechaAutorizacion ? new Date(factura.fechaAutorizacion).toLocaleString('es-EC') : 'PENDIENTE'}`, 100, 42)
  doc.text(`AMBIENTE: ${emisor.ambiente === 1 ? 'PRUEBAS' : 'PRODUCCIÓN'}`, 100, 47)
  doc.text(`EMISIÓN: NORMAL`, 100, 52)

  // Clave de Acceso Box
  doc.text(`CLAVE DE ACCESO:`, 100, 58)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.text(factura.claveAcceso, 100, 62)

  // Draw client info box
  doc.rect(10, 70, 190, 22)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(`Razón Social / Nombres y Apellidos:`, 12, 75)
  doc.setFont('helvetica', 'normal')
  doc.text(pedido.cliente.nombre, 70, 75)
  
  doc.setFont('helvetica', 'bold')
  doc.text(`Identificación:`, 12, 80)
  doc.setFont('helvetica', 'normal')
  doc.text(pedido.cliente.identificacion, 38, 80)

  doc.setFont('helvetica', 'bold')
  doc.text(`Fecha Emisión:`, 120, 80)
  doc.setFont('helvetica', 'normal')
  doc.text(pedido.fecha, 145, 80)

  doc.setFont('helvetica', 'bold')
  doc.text(`Dirección:`, 12, 85)
  doc.setFont('helvetica', 'normal')
  doc.text(pedido.cliente.direccion || 'S/D', 30, 85, { maxWidth: 85 })

  doc.setFont('helvetica', 'bold')
  doc.text(`Correo:`, 120, 85)
  doc.setFont('helvetica', 'normal')
  doc.text(pedido.cliente.email || 'S/D', 135, 85)

  // Details table
  const tableRows = pedido.items.map((item: any) => [
    item.productoId,
    item.cantidad,
    item.producto.nombre,
    `$${Number(item.precioUnitario).toFixed(4)}`,
    `$${(Number(item.subtotal) * (Number(pedido.descuento) / Number(pedido.subtotal) || 0)).toFixed(2)}`,
    `$${Number(item.subtotal).toFixed(2)}`
  ])

  autoTable(doc, {
    startY: 96,
    margin: { left: 10, right: 10 },
    head: [['Cod. Principal', 'Cant.', 'Descripción', 'Precio Unitario', 'Descuento', 'Precio Total']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [102, 51, 153], textColor: [255, 255, 255] },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 15 },
      2: { cellWidth: 75 },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' }
    }
  })

  let finalY = (doc as any).lastAutoTable.finalY + 10

  if (finalY > 235) {
    doc.addPage()
    finalY = 20
  }

  // Totals Box (Right column)
  const rightX = 135
  const tieneIva = Number(pedido.iva) > 0
  const subtotalIva = tieneIva ? Number(pedido.subtotal) : 0
  const subtotal0 = tieneIva ? 0 : Number(pedido.subtotal)

  const totalsRows = [
    { label: 'SUBTOTAL 15%:', val: subtotalIva },
    { label: 'SUBTOTAL 0%:', val: subtotal0 },
    { label: 'SUBTOTAL NO OBJETO IVA:', val: 0 },
    { label: 'SUBTOTAL EXENTO IVA:', val: 0 },
    { label: 'SUBTOTAL SIN IMPUESTOS:', val: Number(pedido.subtotal) },
    { label: 'TOTAL DESCUENTO:', val: Number(pedido.descuento) },
    { label: 'IVA 15%:', val: Number(pedido.iva) },
    { label: 'VALOR TOTAL:', val: Number(pedido.total), bold: true }
  ]

  let currentY = finalY
  totalsRows.forEach((r) => {
    if (r.bold) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
    }
    doc.text(r.label, rightX, currentY)
    doc.text(`$${r.val.toFixed(2)}`, 190, currentY, { align: 'right' })
    currentY += 4.5
  })

  // Payment box (Left column)
  doc.rect(10, finalY - 2, 110, 20)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text(`Forma de Pago`, 12, finalY + 2)
  doc.text(`Valor`, 95, finalY + 2)
  doc.line(10, finalY + 4, 120, finalY + 4)
  
  const mapPagoSRI = (code: string) => {
    if (code === '01') return 'SIN UTILIZACION DEL SISTEMA FINANCIERO'
    if (code === '16') return 'TARJETA DE DEBITO'
    if (code === '19') return 'TARJETA DE CREDITO'
    if (code === '20') return 'OTROS CON UTILIZACION DEL SISTEMA FINANCIERO'
    return 'OTROS'
  }
  
  doc.setFont('helvetica', 'normal')
  doc.text(mapPagoSRI(pedido.formaPago), 12, finalY + 9, { maxWidth: 75 })
  doc.text(`$${Number(pedido.total).toFixed(2)}`, 95, finalY + 9)

  if (descargar) {
    doc.save(`RIDE-${pedido.numero}-${pedido.cliente.nombre.replace(/\s+/g, '_')}.pdf`)
  }
  return doc
}
