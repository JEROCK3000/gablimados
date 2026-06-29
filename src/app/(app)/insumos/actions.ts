'use server'

import { prisma } from '@/lib/db/prisma'
import { registrarLog } from '@/lib/logs/logger'
import { revalidatePath } from 'next/cache'

export async function createInsumoAction(data: any) {
  try {
    const costoUnitario = parseFloat(data.costoTotal) / parseInt(data.cantidadComprada)
    
    await prisma.insumo.create({
      data: {
        nombre: data.nombre,
        tipo: data.tipo,
        cantidadComprada: parseInt(data.cantidadComprada),
        costoTotal: parseFloat(data.costoTotal),
        costoUnitario: costoUnitario,
        proveedor: data.proveedor,
        stockActual: parseInt(data.stockActual) || parseInt(data.cantidadComprada),
      }
    })
    
    await registrarLog('INFO', 'INSUMOS', `Insumo registrado: ${data.nombre}`)
    revalidatePath('/insumos')
    return { success: true }
  } catch (error) {
    await registrarLog('ERROR', 'INSUMOS', `Error creando insumo: ${error}`)
    return { error: 'Ocurrió un error al guardar el insumo' }
  }
}

export async function updateInsumoAction(id: number, data: any) {
  try {
    const costoUnitario = parseFloat(data.costoTotal) / parseInt(data.cantidadComprada)

    await prisma.insumo.update({
      where: { id },
      data: {
        nombre: data.nombre,
        tipo: data.tipo,
        cantidadComprada: parseInt(data.cantidadComprada),
        costoTotal: parseFloat(data.costoTotal),
        costoUnitario: costoUnitario,
        proveedor: data.proveedor,
        stockActual: parseInt(data.stockActual),
      }
    })
    
    await registrarLog('INFO', 'INSUMOS', `Insumo actualizado: ${data.nombre}`)
    revalidatePath('/insumos')
    return { success: true }
  } catch (error) {
    await registrarLog('ERROR', 'INSUMOS', `Error actualizando insumo ${id}: ${error}`)
    return { error: 'Ocurrió un error al actualizar el insumo' }
  }
}

export async function deleteInsumoAction(id: number) {
  try {
    await prisma.insumo.update({
      where: { id },
      data: { activo: false }
    })
    
    await registrarLog('INFO', 'INSUMOS', `Insumo eliminado (soft-delete): ${id}`)
    revalidatePath('/insumos')
    return { success: true }
  } catch (error) {
    await registrarLog('ERROR', 'INSUMOS', `Error eliminando insumo ${id}: ${error}`)
    return { error: 'Ocurrió un error al eliminar el insumo' }
  }
}

export async function createMultipleInsumosAction(items: any[]) {
  try {
    const data = items.map(item => {
      const cantidad = parseInt(item.cantidadComprada) || 1
      const total = parseFloat(item.costoTotal) || 0
      return {
        nombre: item.nombre,
        tipo: item.tipo,
        cantidadComprada: cantidad,
        costoTotal: total,
        costoUnitario: total / cantidad,
        proveedor: item.proveedor,
        stockActual: cantidad,
      }
    })

    await prisma.insumo.createMany({
      data
    })

    await registrarLog('INFO', 'INSUMOS', `Se importaron ${items.length} insumos desde XML`)
    revalidatePath('/insumos')
    return { success: true }
  } catch (error) {
    await registrarLog('ERROR', 'INSUMOS', `Error importando insumos XML: ${error}`)
    return { error: 'Ocurrió un error al importar los insumos' }
  }
}
