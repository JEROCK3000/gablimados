'use server'

import { prisma } from '@/lib/db/prisma'
import { registrarLog } from '@/lib/logs/logger'
import { revalidatePath } from 'next/cache'

interface DatosCostos {
  id?: number
  mes: number
  anio: number
  alquiler: number
  electricidad: number
  salarios: number
  internet: number
  agua: number
  transporte: number
  otros: number
  horasMes: number
  piezasMes: number
}

export async function guardarCostosAction(datos: DatosCostos) {
  try {
    const { id, ...resto } = datos

    if (id) {
      await prisma.costoFijo.update({ where: { id }, data: resto })
    } else {
      await prisma.costoFijo.create({ data: resto })
    }

    await registrarLog('AUDIT', 'CONFIG', `Costos fijos actualizados: ${datos.mes}/${datos.anio}`)
    revalidatePath('/configuracion')
    revalidatePath('/dashboard')
    revalidatePath('/calculadora')
  } catch (error) {
    await registrarLog('ERROR', 'CONFIG', `Error guardando costos: ${error}`)
    throw new Error('No se pudo guardar la configuración')
  }
}
