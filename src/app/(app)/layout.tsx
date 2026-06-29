import { obtenerSesion } from '@/lib/auth/jwt'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const sesion = await obtenerSesion()
  if (!sesion) redirect('/login')

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0f0f1a] overflow-hidden relative">
      {/* Sidebar */}
      <Sidebar nombreUsuario={sesion.nombre} />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          titulo="GABLIMADOS"
          nombreUsuario={sesion.nombre}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="animate-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
