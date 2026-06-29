'use server'

import { prisma } from '@/lib/db/prisma'
import { registrarLog } from '@/lib/logs/logger'
import { revalidatePath } from 'next/cache'

interface GuardarCalculoParams {
  usuarioId: number
  categoriaId: number | null
  nombreCalc: string
  datos: Record<string, unknown>
  resultado: Record<string, unknown>
}

export async function guardarCalculoAction(params: GuardarCalculoParams) {
  try {
    await prisma.calculo.create({
      data: {
        usuarioId: params.usuarioId,
        productoId: null,
        nombreCalc: params.nombreCalc,
        datos: params.datos as any,
        resultado: params.resultado as any,
      },
    })

    await registrarLog('INFO', 'CALCULADORA', `Cálculo guardado: ${params.nombreCalc}`)
    revalidatePath('/dashboard')
  } catch (error) {
    await registrarLog('ERROR', 'CALCULADORA', `Error guardando cálculo: ${error}`)
    throw new Error('No se pudo guardar el cálculo')
  }
}
