import type { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { obtenerSesion } from '@/lib/auth/jwt'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SriConfigForm } from './SriConfigForm'

export const metadata: Metadata = {
  title: 'Configuración SRI — GABLIMADOS',
}

export default async function SriConfiguracionPage() {
  const sesion = await obtenerSesion()
  if (!sesion) redirect('/login')

  const config = await prisma.emisorSRI.findFirst()
  const tokenConfig = await prisma.configNegocio.findUnique({
    where: { clave: 'ecuador_api_token' }
  })
  const ecuadorApiToken = tokenConfig?.valor || ''

  const formattedConfig = {
    ruc: config?.ruc ?? '',
    razonSocial: config?.razonSocial ?? '',
    nombreComercial: config?.nombreComercial ?? '',
    dirMatriz: config?.dirMatriz ?? '',
    dirEstablecimiento: config?.dirEstablecimiento ?? '',
    codigoEstablecimiento: config?.codigoEstablecimiento ?? '001',
    codigoPuntoEmision: config?.codigoPuntoEmision ?? '001',
    obligadoContabilidad: config?.obligadoContabilidad ?? false,
    ambiente: config?.ambiente ?? 1,
    passwordFirma: config?.passwordFirma ?? '',
    rutaFirma: config?.rutaFirma ?? '',
    contribuyenteEspecial: config?.contribuyenteEspecial ?? '',
    agenteRetencion: config?.agenteRetencion ?? '',
    ecuadorApiToken
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">
            Configuración ⚙️
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Parámetros y configuraciones generales del sistema
          </p>
        </div>
      </div>

      <div className="flex gap-6 border-b border-gray-100 dark:border-white/10 pb-px">
        <Link href="/configuracion" className="border-b-2 border-transparent pb-3 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
          Costos Fijos 💵
        </Link>
        <Link href="/configuracion/sri" className="border-b-2 border-verde-500 pb-3 text-sm font-bold text-gray-900 dark:text-white">
          Facturación SRI ⚡
        </Link>
        <Link href="/configuracion/correo" className="border-b-2 border-transparent pb-3 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
          Correo Electrónico ✉️
        </Link>
      </div>

      <SriConfigForm config={formattedConfig} />
    </div>
  )
}
