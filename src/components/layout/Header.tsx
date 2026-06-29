'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun, Bell } from 'lucide-react'
import { useEffect, useState } from 'react'

interface HeaderProps {
  titulo: string
  subtitulo?: string
  nombreUsuario: string
}

export function Header({ titulo, subtitulo, nombreUsuario }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-[#0f0f1a] border-b border-gray-100 dark:border-white/5 flex-shrink-0">
      {/* Título */}
      <div className="ml-12 lg:ml-0">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{titulo}</h1>
        {subtitulo && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitulo}</p>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2">
        {/* Toggle tema */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            id="btn-toggle-tema"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        )}

        {/* Notificaciones */}
        <button
          className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          id="btn-notificaciones"
        >
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-verde-500 rounded-full" />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2.5 ml-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purpura-500 to-verde-500 flex items-center justify-center shadow-glow-purpura">
            <span className="text-white text-sm font-bold">
              {nombreUsuario.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{nombreUsuario}</p>
            <p className="text-[10px] text-gray-500">Admin</p>
          </div>
        </div>
      </div>
    </header>
  )
}
