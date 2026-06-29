import { NextResponse } from 'next/server'
import { obtenerSesion } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'
import { registrarLog } from '@/lib/logs/logger'
import ExcelJS from 'exceljs'

export async function GET() {
  const sesion = await obtenerSesion()
  if (!sesion) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const pedidos = await prisma.pedido.findMany({
      include: {
        cliente: true,
        facturaSRI: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'GABLIMADOS'
    workbook.lastModifiedBy = sesion.nombre
    workbook.created = new Date()

    const sheet = workbook.addWorksheet('Historial de Ventas', {
      pageSetup: { paperSize: 9, orientation: 'landscape' }
    })

    // ─── Encabezado del negocio ───────────────────────────────────────────────
    sheet.mergeCells('A1:L1')
    const titleCell = sheet.getCell('A1')
    titleCell.value = 'GABLIMADOS — Reporte General de Ventas'
    titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF6366F1' } } // Indigo color theme
    titleCell.alignment = { horizontal: 'center' }

    sheet.mergeCells('A2:L2')
    const subtitleCell = sheet.getCell('A2')
    subtitleCell.value = `Generado el: ${new Date().toLocaleDateString('es', {
      day: 'numeric', month: 'long', year: 'numeric',
    })} | Total Pedidos: ${pedidos.length}`
    subtitleCell.font = { name: 'Calibri', size: 10, color: { argb: 'FF6B7280' } }
    subtitleCell.alignment = { horizontal: 'center' }

    sheet.addRow([])

    // ─── Encabezados de columnas ──────────────────────────────────────────────
    const headerRow = sheet.addRow([
      'Nº Pedido', 'Fecha', 'Cliente', 'Identificación',
      'Estado', 'Forma Pago', 'Facturado SRI', 'Nº Factura',
      'Subtotal', 'Descuento', 'IVA 15%', 'Total'
    ])

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F0F23' }, // Charcoal theme
      }
      cell.font = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FF6366F1' } }
      }
    })
    headerRow.height = 30

    // ─── Datos ────────────────────────────────────────────────────────────────
    const moneda = (v: number) => Number(v.toFixed(2))
    
    const mapPagoSRI = (code: string) => {
      if (code === '01') return 'Efectivo'
      if (code === '16') return 'T. Débito'
      if (code === '19') return 'T. Crédito'
      if (code === '20') return 'Transferencia/Cheque'
      return 'Otros'
    }

    pedidos.forEach((p, idx) => {
      let numFactura = '-'
      if (p.facturaSRI) {
        const estab = p.facturaSRI.claveAcceso.substring(24, 27)
        const ptoEmi = p.facturaSRI.claveAcceso.substring(27, 30)
        const seq = p.facturaSRI.claveAcceso.substring(30, 39)
        numFactura = `${estab}-${ptoEmi}-${seq}`
      }

      const row = sheet.addRow([
        p.numero,
        p.createdAt.toLocaleDateString('es-EC'),
        p.cliente.nombre,
        p.cliente.identificacion,
        p.estado,
        mapPagoSRI(p.formaPago),
        p.facturaSRI ? p.facturaSRI.estado : 'NO EMITIDA',
        numFactura,
        moneda(Number(p.subtotal)),
        moneda(Number(p.descuento)),
        moneda(Number(p.iva)),
        moneda(Number(p.total))
      ])

      // Estilos de fila alternada
      const bgColor = idx % 2 === 0 ? 'FFF9FAFB' : 'FFFFFFFF'
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
        cell.font = { name: 'Calibri', size: 10 }
        cell.alignment = { vertical: 'middle' }
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        }
      })

      // Alinear columnas específicas
      row.getCell(1).alignment = { horizontal: 'center' }
      row.getCell(2).alignment = { horizontal: 'center' }
      row.getCell(4).alignment = { horizontal: 'center' }
      row.getCell(5).alignment = { horizontal: 'center' }
      row.getCell(6).alignment = { horizontal: 'center' }
      row.getCell(7).alignment = { horizontal: 'center' }
      row.getCell(8).alignment = { horizontal: 'center' }

      // Formato de moneda para columnas de valores
      for (let c = 9; c <= 12; c++) {
        row.getCell(c).numFmt = '"$"#,##0.00'
      }

      // Colores condicionales para estados de facturación
      const cellSRI = row.getCell(7)
      if (p.facturaSRI?.estado === 'AUTORIZADA') {
        cellSRI.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF10B981' } } // Green
      } else if (p.facturaSRI?.estado === 'PENDIENTE') {
        cellSRI.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFF59E0B' } } // Amber
      } else if (p.facturaSRI?.estado === 'RECHAZADA') {
        cellSRI.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFEF4444' } } // Red
      }
    })

    // ─── Fila de totales ──────────────────────────────────────────────────────
    sheet.addRow([])
    const totalRow = sheet.addRow([
      'TOTALES', '', '', '', '', '', '', '',
      pedidos.reduce((s, p) => s + Number(p.subtotal), 0),
      pedidos.reduce((s, p) => s + Number(p.descuento), 0),
      pedidos.reduce((s, p) => s + Number(p.iva), 0),
      pedidos.reduce((s, p) => s + Number(p.total), 0)
    ])

    totalRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } } // Soft Indigo
      cell.font = { name: 'Calibri', size: 10, bold: true }
      cell.border = { top: { style: 'medium', color: { argb: 'FF6366F1' } } }
    })

    // Formato de moneda para fila de totales
    for (let c = 9; c <= 12; c++) {
      totalRow.getCell(c).numFmt = '"$"#,##0.00'
    }

    // ─── Anchos de columna ────────────────────────────────────────────────────
    sheet.columns = [
      { width: 14 }, // Nº Pedido
      { width: 13 }, // Fecha
      { width: 28 }, // Cliente
      { width: 15 }, // Identificación
      { width: 13 }, // Estado
      { width: 16 }, // Forma Pago
      { width: 15 }, // Facturado SRI
      { width: 18 }, // Nº Factura
      { width: 13 }, // Subtotal
      { width: 13 }, // Descuento
      { width: 13 }, // IVA
      { width: 14 }  // Total
    ]

    const buffer = await workbook.xlsx.writeBuffer()
    const fecha = new Date().toISOString().split('T')[0]

    await registrarLog('AUDIT', 'REPORTES', `Reporte de Ventas Excel generado por: ${sesion.email}`)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="gablimados-ventas-${fecha}.xlsx"`,
      },
    })
  } catch (error) {
    await registrarLog('ERROR', 'REPORTES', `Error generando Excel de ventas: ${error}`)
    return NextResponse.json({ error: 'Error generando reporte de ventas' }, { status: 500 })
  }
}
