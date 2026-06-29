import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/layout/ThemeProvider'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: {
    default: 'GABLIMADOS — Calculadora de Sublimación PRO',
    template: '%s | GABLIMADOS',
  },
  description: 'Sistema profesional de gestión y cálculo de precios para sublimación. Calcula tus costos reales, establece precios rentables y gestiona tu negocio.',
  keywords: ['sublimación', 'calculadora precios', 'emprendimiento', 'costos', 'gablimados'],
  authors: [{ name: 'GABLIMADOS' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'noindex',
}

import { Toaster } from 'sonner'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${outfit.variable} font-sans antialiased`}>
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-right" closeButton />
        </ThemeProvider>
      </body>
    </html>
  )
}
