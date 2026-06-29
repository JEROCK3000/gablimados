import type { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { obtenerSesion } from '@/lib/auth/jwt'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ProductoForm } from '../ProductoForm'

export const metadata: Metadata = {
  title: 'Nuevo Producto — GABLIMADOS',
}

export default async function NuevoProductoPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const params = await searchParams
  const sesion = await obtenerSesion()
  if (!sesion) redirect('/login')

  const categorias = await prisma.categoria.findMany({
    where: { activo: true },
    orderBy: { orden: 'asc' },
  })

  // Costos fijos para el cálculo automático
  const ahora = new Date()
  const costosMes = await prisma.costoFijo.findFirst({
    where: { mes: ahora.getMonth() + 1, anio: ahora.getFullYear() },
  })
  const totalCostosFijos = costosMes
    ? Number(costosMes.alquiler) + Number(costosMes.electricidad) +
      Number(costosMes.salarios) + Number(costosMes.internet) +
      Number(costosMes.agua) + Number(costosMes.transporte) + Number(costosMes.otros)
    : 0

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/productos" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white text-sm mb-4 transition-colors">
          <ArrowLeft size={15} />
          Volver a productos
        </Link>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Nuevo Producto ✨</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Agrega un producto a tu catálogo con sus costos calculados
        </p>
      </div>

      <ProductoForm
        categorias={categorias}
        totalCostosFijos={totalCostosFijos}
        piezasMes={costosMes?.piezasMes ?? 200}
        initialData={params}
      />
    </div>
  )
}
