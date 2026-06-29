'use server'

import { prisma } from '@/lib/db/prisma'
import { revalidatePath } from 'next/cache'

function validarAlgoritmoEcuador(tipo: string, cedula: string): boolean {
  const clean = cedula.trim()
  if (!/^\d+$/.test(clean)) return false

  const prov = parseInt(clean.substring(0, 2), 10)
  if (!((prov >= 1 && prov <= 24) || prov === 30)) return false

  const tercerDigito = parseInt(clean.substring(2, 3), 10)

  if (tipo === 'CEDULA') {
    if (clean.length !== 10) return false
    if (tercerDigito >= 6) return false

    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2]
    let suma = 0
    for (let i = 0; i < 9; i++) {
      let valor = parseInt(clean.charAt(i), 10) * coeficientes[i]
      if (valor >= 10) valor -= 9
      suma += valor
    }
    const verificador = parseInt(clean.charAt(9), 10)
    const residuo = suma % 10
    const digitoCalculado = residuo === 0 ? 0 : 10 - residuo
    return digitoCalculado === verificador
  }

  if (tipo === 'RUC') {
    if (clean.length !== 13) return false

    // RUC personas naturales
    if (tercerDigito < 6) {
      if (!clean.endsWith('001')) return false
      return validarAlgoritmoEcuador('CEDULA', clean.substring(0, 10))
    }

    // RUC personas jurídicas / sociedades privadas
    if (tercerDigito === 9) {
      if (!clean.endsWith('001')) return false
      const coeficientes = [4, 3, 2, 7, 6, 5, 4, 3, 2]
      let suma = 0
      for (let i = 0; i < 9; i++) {
        suma += parseInt(clean.charAt(i), 10) * coeficientes[i]
      }
      const verificador = parseInt(clean.charAt(9), 10)
      const residuo = suma % 11
      const digitoCalculado = residuo === 0 ? 0 : 11 - residuo
      return digitoCalculado === verificador
    }

    // RUC entidades públicas
    if (tercerDigito === 6) {
      if (!clean.endsWith('0001')) return false
      const coeficientes = [3, 2, 7, 6, 5, 4, 3, 2]
      let suma = 0
      for (let i = 0; i < 8; i++) {
        suma += parseInt(clean.charAt(i), 10) * coeficientes[i]
      }
      const verificador = parseInt(clean.charAt(8), 10)
      const residuo = suma % 11
      const digitoCalculado = residuo === 0 ? 0 : 11 - residuo
      return digitoCalculado === verificador
    }
  }

  return false
}

function validarIdentificacionSRI(tipo: string, identificacion: string) {
  const clean = identificacion.trim()
  if (tipo !== 'PASAPORTE' && !/^\d+$/.test(clean)) {
    throw new Error('La identificación debe contener solo números')
  }
  if (tipo === 'CEDULA') {
    if (clean.length !== 10) {
      throw new Error('La cédula ecuatoriana debe tener exactamente 10 dígitos')
    }
    if (!validarAlgoritmoEcuador('CEDULA', clean)) {
      throw new Error('La cédula ingresada es inválida (falló dígito verificador)')
    }
  } else if (tipo === 'RUC') {
    if (clean.length !== 13) {
      throw new Error('El RUC debe tener exactamente 13 dígitos')
    }
    if (!validarAlgoritmoEcuador('RUC', clean)) {
      throw new Error('El RUC ingresado es inválido (falló dígito verificador)')
    }
  } else if (tipo === 'CONSUMIDOR_FINAL') {
    if (clean !== '9999999999999') {
      throw new Error('Consumidor Final debe tener identificación 9999999999999')
    }
  } else if (tipo === 'PASAPORTE') {
    if (clean.length < 5) {
      throw new Error('El pasaporte debe tener al menos 5 caracteres')
    }
  }
}

export async function crearClienteAction(data: {
  identificacion: string
  tipoIdentificacion: string
  nombre: string
  email: string
  telefono: string
  direccion: string
}) {
  validarIdentificacionSRI(data.tipoIdentificacion, data.identificacion)
  try {
    await prisma.cliente.create({ data })
    revalidatePath('/clientes')
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error('Ya existe un cliente con esta identificación')
    }
    throw new Error('Error al crear el cliente')
  }
}

export async function actualizarClienteAction(id: number, data: {
  identificacion: string
  tipoIdentificacion: string
  nombre: string
  email: string
  telefono: string
  direccion: string
}) {
  validarIdentificacionSRI(data.tipoIdentificacion, data.identificacion)
  try {
    await prisma.cliente.update({ where: { id }, data })
    revalidatePath('/clientes')
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error('Ya existe un cliente con esta identificación')
    }
    throw new Error('Error al actualizar el cliente')
  }
}

export async function desactivarClienteAction(id: number) {
  try {
    await prisma.cliente.update({ where: { id }, data: { activo: false } })
    revalidatePath('/clientes')
  } catch (error) {
    throw new Error('Error al desactivar el cliente')
  }
}
