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
  const isVenta = data.estado === 'VENTA'
  const prefix = isVenta ? 'VEN-' : 'PED-'
  const ultimoPedido = await prisma.pedido.findFirst({
    where: { numero: { startsWith: prefix } },
    orderBy: { id: 'desc' }
  })
  let numero = `${prefix}00001`
  if (ultimoPedido) {
    const ultimoNum = parseInt(ultimoPedido.numero.replace(prefix, ''), 10)
    numero = `${prefix}${String(ultimoNum + 1).padStart(5, '0')}`
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

export async function actualizarPedidoAction(id: number, data: {
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
    cantidad: number
    precioUnitario: number
    subtotal: number
  }>
}) {
  const current = await prisma.pedido.findUnique({
    where: { id },
    include: { facturaSRI: true }
  })

  if (!current) throw new Error('Pedido no encontrado')
  if (current.facturaSRI && current.facturaSRI.estado === 'AUTORIZADA') {
    throw new Error('No se puede modificar un registro que ya posee una factura autorizada por el SRI.')
  }

  try {
    await prisma.$transaction([
      prisma.pedidoItem.deleteMany({ where: { pedidoId: id } }),
      prisma.pedido.update({
        where: { id },
        data: {
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
              subtotal: item.subtotal
            }))
          }
        }
      })
    ])

    await registrarLog('AUDIT', 'PEDIDOS', `Pedido/Venta actualizado: ${current.numero}`)
    revalidatePath('/pedidos')
    revalidatePath('/ventas')
  } catch (error: any) {
    console.error('Error al actualizar pedido:', error)
    throw new Error('Error al actualizar el registro: ' + (error.message || String(error)))
  }
}

export async function eliminarPedidoAction(id: number) {
  const current = await prisma.pedido.findUnique({
    where: { id },
    include: { facturaSRI: true }
  })

  if (!current) throw new Error('Registro no encontrado')
  if (current.facturaSRI && current.facturaSRI.estado === 'AUTORIZADA') {
    throw new Error('No se puede eliminar un registro que ya posee una factura autorizada por el SRI.')
  }

  try {
    await prisma.pedido.delete({
      where: { id }
    })

    await registrarLog('AUDIT', 'PEDIDOS', `Pedido/Venta eliminado: ${current.numero}`)
    revalidatePath('/pedidos')
    revalidatePath('/ventas')
  } catch (error: any) {
    console.error('Error al eliminar pedido:', error)
    throw new Error('Error al eliminar el registro: ' + (error.message || String(error)))
  }
}
