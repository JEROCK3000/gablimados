import type { Metadata } from 'next'
import { LoginForm } from './LoginForm'
import { estaAutenticado } from '@/lib/auth/jwt'
import { redirect } from 'next/navigation'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Iniciar Sesión — GABLIMADOS',
}

export default async function LoginPage() {
  const autenticado = await estaAutenticado()
  if (autenticado) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#0a0a16] flex">
      {/* Panel izquierdo - Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden">
        {/* Fondo animado */}
        <div className="absolute inset-0 hero-gradient opacity-90" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-verde-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purpura-500/15 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-dorado-400/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-glow-verde flex-shrink-0">
              <Image src="/logo.jpg" alt="Gablimados Logo" width={44} height={44} className="rounded-xl object-contain w-full h-full" />
            </div>
            <div>
              <div className="text-2xl font-black tracking-wide">
                <span className="text-verde-400">GABLI</span>
                <span className="text-purpura-400">MADOS</span>
              </div>
              <p className="text-gray-400 text-xs uppercase tracking-widest">Sublimación PRO</p>
            </div>
          </div>
        </div>

        {/* Contenido central */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <h2 className="text-4xl font-black text-white leading-tight mb-6">
            Calcula tus precios.<br />
            <span className="text-verde-400">Crece tu negocio.</span>
          </h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-8">
            Sistema profesional de cálculo de costos para sublimación. 
            Conoce tus costos reales y establece precios rentables.
          </p>

          {/* Features */}
          <div className="space-y-4">
            {[
              { emoji: '🧮', text: 'Calculadora de costos con desglose completo' },
              { emoji: '📦', text: 'Catálogo de productos con precios actualizados' },
              { emoji: '🌡️', text: 'Base de datos de tiempos y temperaturas' },
              { emoji: '📊', text: 'Reportes Excel y PDF profesionales' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm">
                  {item.emoji}
                </div>
                <span className="text-gray-300 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-gray-600 text-xs">© 2024 GABLIMADOS. Todos los derechos reservados.</p>
        </div>
      </div>

      {/* Panel derecho - Formulario */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        <div className="absolute inset-0 bg-[#0a0a16]" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-purpura-500/5 rounded-full blur-3xl" />

        <div className="relative z-10 w-full max-w-md">
          {/* Logo mobile */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center flex-shrink-0">
              <Image src="/logo.jpg" alt="Gablimados Logo" width={32} height={32} className="rounded-lg object-contain w-full h-full" />
            </div>
            <div className="text-xl font-black">
              <span className="text-verde-400">GABLI</span>
              <span className="text-purpura-400">MADOS</span>
            </div>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}
