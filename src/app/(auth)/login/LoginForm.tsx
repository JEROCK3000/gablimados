'use client'

import { loginAction } from '@/lib/auth/actions'
import { useActionState } from 'react'
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'

const initialState = { error: '' }

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div>
      <div className="mb-8 flex flex-col items-center sm:items-start">
        <div className="w-16 h-16 rounded-2xl bg-white p-1.5 mb-4 shadow-lg">
          <Image src="/logo.jpg" alt="Gablimados Logo" width={52} height={52} className="rounded-xl object-contain w-full h-full" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Bienvenida 👋</h1>
        <p className="text-gray-400 text-sm">Ingresa a tu sistema de sublimación</p>
      </div>

      <form action={formAction} className="space-y-5">
        {/* Email */}
        <div>
          <label htmlFor="email" className="label text-gray-300">
            Correo electrónico
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
              <Mail size={16} />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="tu@correo.com"
              className="input !pl-10 bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-verde-500 focus:bg-white/8"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="label text-gray-300">
            Contraseña
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
              <Lock size={16} />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="input !pl-10 !pr-11 bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-verde-500 focus:bg-white/8"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Error */}
        {state?.error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <span>⚠️</span>
            <span>{state.error}</span>
          </div>
        )}

        {/* Submit */}
        <button
          id="btn-login"
          type="submit"
          disabled={isPending}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3"
        >
          {isPending ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              <span>Ingresando...</span>
            </>
          ) : (
            <span>Iniciar sesión</span>
          )}
        </button>
      </form>

      <div className="mt-6 p-4 rounded-xl bg-white/3 border border-white/5">
        <p className="text-gray-500 text-xs text-center">
          🔒 Conexión segura · Sesión de 7 días
        </p>
      </div>
    </div>
  )
}
