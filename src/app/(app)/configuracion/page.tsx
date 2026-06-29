import type { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { obtenerSesion } from '@/lib/auth/jwt'
import { redirect } from 'next/navigation'
import { ConfigForm } from './ConfigForm'

import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Configuración — GABLIMADOS',
}

export default async function ConfiguracionPage() {
  const sesion = await obtenerSesion()
  if (!sesion) redirect('/login')

  const ahora = new Date()
  const mes = ahora.getMonth() + 1
  const anio = ahora.getFullYear()

  const costosMes = await prisma.costoFijo.findFirst({
    where: { mes, anio },
  })

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
        <Link href="/configuracion" className="border-b-2 border-verde-500 pb-3 text-sm font-bold text-gray-900 dark:text-white">
          Costos Fijos 💵
        </Link>
        <Link href="/configuracion/sri" className="border-b-2 border-transparent pb-3 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
          Facturación SRI ⚡
        </Link>
        <Link href="/configuracion/correo" className="border-b-2 border-transparent pb-3 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
          Correo Electrónico ✉️
        </Link>
      </div>

      <div className="card border-dorado-400/20 bg-dorado-50/30 dark:bg-dorado-400/5">
        <div className="flex gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <p className="text-sm font-semibold text-dorado-700 dark:text-dorado-400 mb-1">
              ¿Por qué son importantes los costos fijos?
            </p>
            <p className="text-xs text-dorado-600 dark:text-dorado-300/70 leading-relaxed">
              Estos gastos existen aunque no produzcas nada. Al dividirlos entre las piezas que produces,
              obtenemos el costo fijo por pieza que debe incluirse en tus precios.
            </p>
          </div>
        </div>
      </div>

      <ConfigForm costosMes={costosMes ? {
        id: costosMes.id,
        alquiler: Number(costosMes.alquiler),
        electricidad: Number(costosMes.electricidad),
        salarios: Number(costosMes.salarios),
        internet: Number(costosMes.internet),
        agua: Number(costosMes.agua),
        transporte: Number(costosMes.transporte),
        otros: Number(costosMes.otros),
        horasMes: costosMes.horasMes,
        piezasMes: costosMes.piezasMes,
      } : null} mes={mes} anio={anio} />
    </div>
  )
}
