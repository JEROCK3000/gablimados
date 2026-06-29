import type { Metadata } from 'next'
import { obtenerSesion } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'
import { redirect } from 'next/navigation'
import { CalculadoraForm } from './CalculadoraForm'

export const metadata: Metadata = {
  title: 'Calculadora — GABLIMADOS',
}

export default async function CalculadoraPage() {
  const sesion = await obtenerSesion()
  if (!sesion) redirect('/login')

  // Obtener costos fijos del mes actual para pre-llenar
  const ahora = new Date()
  const costosMes = await prisma.costoFijo.findFirst({
    where: { mes: ahora.getMonth() + 1, anio: ahora.getFullYear() },
  })

  const totalCostosFijos = costosMes
    ? Number(costosMes.alquiler) + Number(costosMes.electricidad) +
      Number(costosMes.salarios) + Number(costosMes.internet) +
      Number(costosMes.agua) + Number(costosMes.transporte) + Number(costosMes.otros)
    : 0

  // Categorías para selector de producto
  const categorias = await prisma.categoria.findMany({
    where: { activo: true },
    orderBy: { orden: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white">
          Calculadora de Precios 🧮
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Calcula el precio justo para tus productos de sublimación
        </p>
      </div>

      <CalculadoraForm
        totalCostosFijos={totalCostosFijos}
        piezasMes={costosMes?.piezasMes ?? 200}
        usuarioId={Number(sesion.sub)}
        categorias={categorias}
      />
    </div>
  )
}
