'use server'

import { prisma } from '@/lib/db/prisma'
import { revalidatePath } from 'next/cache'
import { registrarLog } from '@/lib/logs/logger'

export async function crearPedidoAction(data: {
  clienteId: number
  estado: string
  formaPago: string
  notas?: string
  subtotal: number
  iva: number
  descuento: number
  total: number
  items: Array<{
    productoId: number
    whitespace?: string
    cantidad: number
    precioUnitario: number
    subtotal: number
  }>
}) {
  const ultimoPedido = await prisma.pedido.findFirst({
    orderBy: { id: 'desc' }
  })
  let numero = 'PED-00001'
  if (ultimoPedido) {
    const ultimoNum = parseInt(ultimoPedido.numero.replace('PED-', ''), 10)
    numero = `PED-${String(ultimoNum + 1).padStart(5, '0')}`
  }

  try {
    await prisma.pedido.create({
      data: {
        numero,
        clienteId: data.clienteId,
        estado: data.estado,
        formaPago: data.formaPago,
        notas: data.notas,
        subtotal: data.subtotal,
        iva: data.iva,
        descuento: data.descuento,
        total: data.total,
        items: {
          create: data.items.map(item => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.subtotal,
          }))
        }
      }
    })
    await registrarLog('AUDIT', 'PEDIDOS', `Pedido/Cotización creado: ${numero}`)
    revalidatePath('/pedidos')
  } catch (error: any) {
    console.error('Error in crearPedidoAction:', error)
    await registrarLog('ERROR', 'PEDIDOS', `Error al crear pedido: ${error.message || error}`)
    throw new Error('Error al crear el pedido o cotización: ' + (error.message || String(error)))
  }
}

export async function actualizarEstadoPedidoAction(id: number, nuevoEstado: string) {
  try {
    await prisma.pedido.update({
      where: { id },
      data: { estado: nuevoEstado }
    })
    revalidatePath('/pedidos')
  } catch (error) {
    throw new Error('Error al actualizar estado')
  }
}
