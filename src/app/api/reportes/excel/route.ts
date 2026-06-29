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
    const productos = await prisma.producto.findMany({
      where: { activo: true },
      include: { categoria: true },
      orderBy: [{ categoria: { nombre: 'asc' } }, { nombre: 'asc' }],
    })

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'GABLIMADOS'
    workbook.lastModifiedBy = sesion.nombre
    workbook.created = new Date()

    const sheet = workbook.addWorksheet('Lista de Precios', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    })

    // ─── Encabezado del negocio ───────────────────────────────────────────────
    sheet.mergeCells('A1:H1')
    const titleCell = sheet.getCell('A1')
    titleCell.value = 'GABLIMADOS — Lista de Precios'
    titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF5CB830' } }
    titleCell.alignment = { horizontal: 'center' }

    sheet.mergeCells('A2:H2')
    const subtitleCell = sheet.getCell('A2')
    subtitleCell.value = `Generado el: ${new Date().toLocaleDateString('es', {
      day: 'numeric', month: 'long', year: 'numeric',
    })} | Total productos: ${productos.length}`
    subtitleCell.font = { name: 'Calibri', size: 10, color: { argb: 'FF6B7280' } }
    subtitleCell.alignment = { horizontal: 'center' }

    sheet.addRow([])

    // ─── Encabezados de columnas ──────────────────────────────────────────────
    const headerRow = sheet.addRow([
      'Producto', 'Categoría', 'Costo Insumo', 'Costo Papel',
      'Costo Tinta', 'Costo Eléctrico', 'Costo Fijo', 'Costo Total',
      'Precio Mínimo', 'Precio Sugerido', 'Margen %', 'Ganancia/pieza'
    ])

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1A1A2E' },
      }
      cell.font = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FF5CB830' } },
      }
    })
    headerRow.height = 30

    // ─── Datos ────────────────────────────────────────────────────────────────
    const moneda = (v: number) => Number(v.toFixed(2))
    const VERDE = 'FF5CB830'
    const ROJO = 'FFEF4444'
    const NARANJA = 'FFF97316'

    productos.forEach((p, idx) => {
      const costoTotal = Number(p.costoTotal)
      const precioSugerido = Number(p.precioSugerido)
      const precioMinimo = Number(p.precioMinimo)
      const margen = Number(p.margen)
      const ganancia = precioSugerido - costoTotal

      const row = sheet.addRow([
        p.nombre,
        p.categoria.nombre,
        moneda(Number(p.costoInsumo)),
        moneda(Number(p.costoPapel)),
        moneda(Number(p.costoTinta)),
        moneda(Number(p.costoElectrico)),
        moneda(Number(p.costoFijoPieza)),
        moneda(costoTotal),
        moneda(precioMinimo),
        moneda(precioSugerido),
        moneda(margen),
        moneda(ganancia),
      ])

      // Fila alternada
      const bgColor = idx % 2 === 0 ? 'FFF8F9FA' : 'FFFFFFFF'
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
        cell.font = { name: 'Calibri', size: 10 }
        cell.alignment = { vertical: 'middle' }
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        }
      })

      // Colorear costos y precios
      const celdaCostoTotal = row.getCell(8)
      celdaCostoTotal.font = { name: 'Calibri', size: 10, bold: true, color: { argb: ROJO } }

      const celdaPrecioMin = row.getCell(9)
      celdaPrecioMin.font = { name: 'Calibri', size: 10, bold: true, color: { argb: NARANJA } }

      const celdaPrecioSug = row.getCell(10)
      celdaPrecioSug.font = { name: 'Calibri', size: 10, bold: true, color: { argb: VERDE } }

      const celdaMargen = row.getCell(11)
      celdaMargen.font = {
        name: 'Calibri', size: 10, bold: true,
        color: { argb: margen < 20 ? 'FFEF4444' : VERDE },
      }

      // Formato moneda
      for (let c = 3; c <= 12; c++) {
        if (c !== 11) {
          row.getCell(c).numFmt = '"$"#,##0.00'
        } else {
          row.getCell(c).numFmt = '0.0"%"'
        }
      }
    })

    // ─── Fila de totales ──────────────────────────────────────────────────────
    sheet.addRow([])
    const totalRow = sheet.addRow([
      'TOTALES / PROMEDIOS', '',
      '', '', '', '', '',
      productos.reduce((s, p) => s + Number(p.costoTotal), 0) / (productos.length || 1),
      productos.reduce((s, p) => s + Number(p.precioMinimo), 0) / (productos.length || 1),
      productos.reduce((s, p) => s + Number(p.precioSugerido), 0) / (productos.length || 1),
      productos.reduce((s, p) => s + Number(p.margen), 0) / (productos.length || 1),
      '',
    ])
    totalRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } }
      cell.font = { name: 'Calibri', size: 10, bold: true }
      cell.border = { top: { style: 'medium', color: { argb: VERDE } } }
    })

    // ─── Anchos de columna ────────────────────────────────────────────────────
    sheet.columns = [
      { width: 30 }, { width: 16 }, { width: 14 }, { width: 14 },
      { width: 14 }, { width: 15 }, { width: 13 }, { width: 13 },
      { width: 14 }, { width: 15 }, { width: 10 }, { width: 14 },
    ]

    // ─── Buffer y respuesta ───────────────────────────────────────────────────
    const buffer = await workbook.xlsx.writeBuffer()
    const fecha = new Date().toISOString().split('T')[0]

    await registrarLog('AUDIT', 'REPORTES', `Reporte Excel generado por: ${sesion.email}`)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="gablimados-precios-${fecha}.xlsx"`,
      },
    })
  } catch (error) {
    await registrarLog('ERROR', 'REPORTES', `Error generando Excel: ${error}`)
    return NextResponse.json({ error: 'Error generando reporte' }, { status: 500 })
  }
}
