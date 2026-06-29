'use client'

import { useState } from 'react'
import { Mail, ShieldCheck, RefreshCw, Save, Send } from 'lucide-react'
import { toast } from 'sonner'
import { guardarCorreoConfigAction, probarConexionAction } from './actions'

interface Props {
  config: {
    smtp_host: string
    smtp_port: string
    smtp_user: string
    smtp_pass: string
    smtp_secure: boolean
    smtp_from_name?: string
    smtp_from_email?: string
    smtp_from?: string // backwards compat
  } | null
}

export function CorreoConfigForm({ config }: Props) {
  const [host, setHost] = useState(config?.smtp_host || '')
  const [port, setPort] = useState(config?.smtp_port || '465')
  const [user, setUser] = useState(config?.smtp_user || '')
  const [pass, setPass] = useState(config?.smtp_pass || '')
  const [secure, setSecure] = useState(config ? config.smtp_secure : true)
  
  const [fromName, setFromName] = useState(config?.smtp_from_name || 'GABLIMADOS Facturación')
  const [fromEmail, setFromEmail] = useState(config?.smtp_from_email || config?.smtp_from || '')
  const [emailPrueba, setEmailPrueba] = useState('')

  const [loadingSave, setLoadingSave] = useState(false)
  const [loadingTest, setLoadingTest] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!host || !port || !user || !pass) {
      toast.error('Por favor, completa los campos obligatorios.')
      return
    }

    setLoadingSave(true)
    try {
      const res = await guardarCorreoConfigAction({
        smtp_host: host,
        smtp_port: port,
        smtp_user: user,
        smtp_pass: pass,
        smtp_secure: secure,
        smtp_from_name: fromName,
        smtp_from_email: fromEmail || user
      })

      if (res.success) {
        toast.success('Configuración SMTP guardada correctamente.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar la configuración.')
    } finally {
      setLoadingSave(false)
    }
  }

  const handleTest = async () => {
    if (!host || !port || !user || !pass) {
      toast.error('Completa los datos SMTP antes de probar la conexión.')
      return
    }

    if (!emailPrueba) {
      toast.error('Por favor, ingresa un correo de destino para recibir el email de prueba.')
      return
    }

    setLoadingTest(true)
    const testPromise = probarConexionAction({
      smtp_host: host,
      smtp_port: port,
      smtp_user: user,
      smtp_pass: pass,
      smtp_secure: secure,
      smtp_from_name: fromName,
      smtp_from_email: fromEmail || user,
      destinatario: emailPrueba
    })

    toast.promise(testPromise, {
      loading: 'Probando conexión y enviando correo de prueba...',
      success: `¡Conexión SMTP verificada y correo enviado con éxito a ${emailPrueba}!`,
      error: (err) => err.message || 'La prueba de conexión SMTP falló.'
    })

    try {
      await testPromise
    } catch (err) {
      // toast.promise already shows the error toast
    } finally {
      setLoadingTest(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="card border border-white/5 bg-[#0f0f23]/60 space-y-4">
        <h3 className="font-bold text-white flex items-center gap-2 text-sm border-b border-white/5 pb-2">
          <Mail size={16} className="text-purpura-400" />
          Servidor de Correo Saliente (SMTP)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-gray-400">Servidor SMTP *</label>
            <input
              type="text"
              value={host}
              onChange={e => setHost(e.target.value)}
              placeholder="smtp.gmail.com o mail.tudominio.com"
              className="input"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400">Puerto SMTP *</label>
            <input
              type="text"
              value={port}
              onChange={e => setPort(e.target.value)}
              placeholder="465 o 587"
              className="input"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400">Usuario de Correo (Email) *</label>
            <input
              type="email"
              value={user}
              onChange={e => setUser(e.target.value)}
              placeholder="ejemplo@correo.com"
              className="input"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400">Contraseña de Correo *</label>
            <input
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              placeholder="••••••••••••••••"
              className="input"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400">Nombre del Remitente (ej: GABLIMADOS EC)</label>
            <input
              type="text"
              value={fromName}
              onChange={e => setFromName(e.target.value)}
              placeholder="GABLIMADOS Facturación"
              className="input"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400">Correo del Remitente (Email de Envío)</label>
            <input
              type="email"
              value={fromEmail}
              onChange={e => setFromEmail(e.target.value)}
              placeholder="facturas@tudominio.com (opcional)"
              className="input"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 h-10 px-3 bg-[#0a0a16]/60 rounded-xl border border-white/5 mt-1.5">
              <input
                type="checkbox"
                id="secure-conn"
                checked={secure}
                onChange={e => setSecure(e.target.checked)}
                className="w-4 h-4 rounded text-purpura-600 bg-black/40 border-white/10 focus:ring-purpura-500"
              />
              <label htmlFor="secure-conn" className="text-xs font-medium text-gray-300 select-none cursor-pointer flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-green-400" />
                Conexión segura SSL/TLS (Recomendado)
              </label>
            </div>
          </div>
        </div>

        {/* Sección de Pruebas */}
        <div className="border-t border-white/5 pt-4 mt-2 space-y-3">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pruebas de Funcionamiento (Opcional)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400">Correo Receptor de Pruebas</label>
              <input
                type="email"
                value={emailPrueba}
                onChange={e => setEmailPrueba(e.target.value)}
                placeholder="tu_correo_personal@gmail.com"
                className="input"
              />
              <p className="text-[10px] text-gray-500">
                Escribe un correo real para recibir un email de validación al presionar "Probar Conexión".
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-end items-center">
        <button
          type="button"
          onClick={handleTest}
          disabled={loadingTest || loadingSave}
          className="flex items-center justify-center gap-1.5 px-4 py-2 border border-white/10 hover:bg-white/5 text-indigo-400 hover:text-indigo-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer w-full sm:w-auto h-9"
        >
          {loadingTest ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
          Probar Conexión SMTP 📬
        </button>

        <button
          type="submit"
          disabled={loadingSave || loadingTest}
          className="flex items-center justify-center gap-1.5 px-5 py-2 bg-verde-600 hover:bg-verde-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-verde-500/10 disabled:opacity-50 cursor-pointer w-full sm:w-auto h-9"
        >
          {loadingSave ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
          Guardar Configuración
        </button>
      </div>
    </form>
  )
}
