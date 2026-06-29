'use server'

import { prisma } from '@/lib/db/prisma'
import { registrarLog } from '@/lib/logs/logger'
import { revalidatePath } from 'next/cache'

interface DatosProducto {
  nombre: string
  descripcion: string | null
  categoriaId: number
  costoInsumo: number
  costoPapel: number
  costoTinta: number
  costoElectrico: number
  costoFijoPieza: number
  costoTotal: number
  precioMinimo: number
  precioSugerido: number
  margen: number
}

export async function crearProductoAction(datos: DatosProducto) {
  try {
    await prisma.producto.create({ data: datos })
    await registrarLog('AUDIT', 'PRODUCTOS', `Producto creado: ${datos.nombre}`)
    revalidatePath('/productos')
    revalidatePath('/dashboard')
  } catch (error) {
    await registrarLog('ERROR', 'PRODUCTOS', `Error creando producto: ${error}`)
    throw new Error('No se pudo crear el producto')
  }
}

export async function actualizarProductoAction(id: number, datos: DatosProducto) {
  try {
    await prisma.producto.update({ where: { id }, data: datos })
    await registrarLog('AUDIT', 'PRODUCTOS', `Producto actualizado: ${datos.nombre}`)
    revalidatePath('/productos')
  } catch (error) {
    await registrarLog('ERROR', 'PRODUCTOS', `Error actualizando producto: ${error}`)
    throw new Error('No se pudo actualizar el producto')
  }
}

export async function eliminarProductoAction(id: number) {
  try {
    await prisma.producto.update({ where: { id }, data: { activo: false } })
    await registrarLog('AUDIT', 'PRODUCTOS', `Producto eliminado (soft): ID ${id}`)
    revalidatePath('/productos')
  } catch (error) {
    await registrarLog('ERROR', 'PRODUCTOS', `Error eliminando producto: ${error}`)
    throw new Error('No se pudo eliminar el producto')
  }
}
