import type { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { obtenerSesion } from '@/lib/auth/jwt'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CorreoConfigForm } from './CorreoConfigForm'

export const metadata: Metadata = {
  title: 'Configuración de Correo — GABLIMADOS',
}

export default async function CorreoConfiguracionPage() {
  const sesion = await obtenerSesion()
  if (!sesion) redirect('/login')

  const configs = await prisma.configNegocio.findMany({
    where: {
      clave: {
        in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_secure', 'smtp_from', 'smtp_from_name', 'smtp_from_email']
      }
    }
  })

  const getConf = (key: string) => configs.find(c => c.clave === key)?.valor || ''

  const formattedConfig = {
    smtp_host: getConf('smtp_host'),
    smtp_port: getConf('smtp_port'),
    smtp_user: getConf('smtp_user'),
    smtp_pass: getConf('smtp_pass'),
    smtp_secure: getConf('smtp_secure') === 'true',
    smtp_from_name: getConf('smtp_from_name') || 'GABLIMADOS Facturación',
    smtp_from_email: getConf('smtp_from_email') || getConf('smtp_from')
  }

  const hasConfig = configs.length > 0

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
        <Link href="/configuracion/sri" className="border-b-2 border-transparent pb-3 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
          Facturación SRI ⚡
        </Link>
        <Link href="/configuracion/correo" className="border-b-2 border-verde-500 pb-3 text-sm font-bold text-gray-900 dark:text-white">
          Correo Electrónico ✉️
        </Link>
      </div>

      <div className="card border-dorado-400/20 bg-dorado-50/30 dark:bg-dorado-400/5">
        <div className="flex gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <p className="text-sm font-semibold text-dorado-700 dark:text-dorado-400 mb-1">
              Configura el Servidor de Correo SMTP
            </p>
            <p className="text-xs text-dorado-600 dark:text-dorado-300/70 leading-relaxed">
              Esta configuración se almacena de forma segura en la base de datos y se utiliza para enviar de manera directa 
              las facturas autorizadas (XML y PDF RIDE) a tus clientes por correo. Puedes usar tu propio dominio o servidores como Gmail.
            </p>
          </div>
        </div>
      </div>

      <CorreoConfigForm config={hasConfig ? formattedConfig : null} />
    </div>
  )
}
