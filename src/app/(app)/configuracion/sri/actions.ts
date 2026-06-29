'use server'

import { prisma } from '@/lib/db/prisma'
import { registrarLog } from '@/lib/logs/logger'
import { revalidatePath } from 'next/cache'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

export async function guardarConfiguracionSRIAction(formData: FormData) {
  const ruc = formData.get('ruc') as string
  const razonSocial = formData.get('razonSocial') as string
  const nombreComercial = formData.get('nombreComercial') as string
  const dirMatriz = formData.get('dirMatriz') as string
  const dirEstablecimiento = formData.get('dirEstablecimiento') as string
  const codigoEstablecimiento = formData.get('codigoEstablecimiento') as string
  const codigoPuntoEmision = formData.get('codigoPuntoEmision') as string
  const obligadoContabilidad = formData.get('obligadoContabilidad') === 'true'
  const ambiente = parseInt(formData.get('ambiente') as string, 10) || 1
  const passwordFirma = formData.get('passwordFirma') as string
  const contribuyenteEspecial = formData.get('contribuyenteEspecial') as string
  const agenteRetencion = formData.get('agenteRetencion') as string
  const ecuadorApiToken = formData.get('ecuadorApiToken') as string || ''
  
  const archivoFirma = formData.get('firma') as File | null

  let rutaFirma = ''
  
  const configActual = await prisma.emisorSRI.findFirst()

  if (archivoFirma && archivoFirma.size > 0) {
    const buffer = Buffer.from(await archivoFirma.arrayBuffer())
    const dirSri = join(process.cwd(), 'storage', 'sri')
    if (!existsSync(dirSri)) {
      mkdirSync(dirSri, { recursive: true })
    }
    const pathFirma = join(dirSri, 'firma.p12')
    writeFileSync(pathFirma, buffer)
    rutaFirma = pathFirma
  } else if (configActual) {
    rutaFirma = configActual.rutaFirma
  } else {
    throw new Error('Debe subir un archivo de firma electrónica (.p12)')
  }

  try {
    const datos = {
      ruc,
      razonSocial,
      nombreComercial: nombreComercial || null,
      dirMatriz,
      dirEstablecimiento,
      codigoEstablecimiento,
      codigoPuntoEmision,
      obligadoContabilidad,
      ambiente,
      passwordFirma,
      rutaFirma,
      contribuyenteEspecial: contribuyenteEspecial || null,
      agenteRetencion: agenteRetencion || null,
    }

    if (configActual) {
      await prisma.emisorSRI.update({
        where: { id: configActual.id },
        data: datos
      })
    } else {
      await prisma.emisorSRI.create({
        data: datos
      })
    }

    // Guardar también el token de EcuadorAPI en config_negocio
    await prisma.configNegocio.upsert({
      where: { clave: 'ecuador_api_token' },
      update: { valor: ecuadorApiToken.trim() },
      create: { clave: 'ecuador_api_token', valor: ecuadorApiToken.trim() }
    })

    await registrarLog('AUDIT', 'CONFIG', 'Configuración de emisor SRI y EcuadorAPI guardada.')
    revalidatePath('/configuracion')
  } catch (error: any) {
    await registrarLog('ERROR', 'CONFIG', `Error al guardar configuración emisor SRI: ${error.message || error}`)
    throw new Error('Error al guardar configuración: ' + (error.message || error))
  }
}
