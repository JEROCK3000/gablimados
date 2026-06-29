'use server'

import { prisma } from '@/lib/db/prisma'
import { obtenerSesion } from '@/lib/auth/jwt'
import { registrarLog } from '@/lib/logs/logger'
import nodemailer from 'nodemailer'

export async function guardarCorreoConfigAction(data: {
  smtp_host: string
  smtp_port: string
  smtp_user: string
  smtp_pass: string
  smtp_secure: boolean
  smtp_from_name: string
  smtp_from_email: string
}) {
  const sesion = await obtenerSesion()
  if (!sesion) {
    throw new Error('No autorizado')
  }

  const items = [
    { clave: 'smtp_host', valor: data.smtp_host.trim() },
    { clave: 'smtp_port', valor: data.smtp_port.trim() },
    { clave: 'smtp_user', valor: data.smtp_user.trim() },
    { clave: 'smtp_pass', valor: data.smtp_pass }, // do not trim password
    { clave: 'smtp_secure', valor: String(data.smtp_secure) },
    { clave: 'smtp_from_name', valor: data.smtp_from_name.trim() },
    { clave: 'smtp_from_email', valor: data.smtp_from_email.trim() }
  ]

  for (const item of items) {
    await prisma.configNegocio.upsert({
      where: { clave: item.clave },
      update: { valor: item.valor },
      create: { clave: item.clave, valor: item.valor }
    })
  }

  await registrarLog('AUDIT', 'CONFIGURACION', `Configuración SMTP actualizada por: ${sesion.email}`)
  return { success: true }
}

export async function probarConexionAction(data: {
  smtp_host: string
  smtp_port: string
  smtp_user: string
  smtp_pass: string
  smtp_secure: boolean
  smtp_from_name: string
  smtp_from_email: string
  destinatario: string
}) {
  const sesion = await obtenerSesion()
  if (!sesion) {
    throw new Error('No autorizado')
  }

  const host = data.smtp_host.trim()
  const port = parseInt(data.smtp_port.trim(), 10)
  const user = data.smtp_user.trim()
  const pass = data.smtp_pass
  const secure = data.smtp_secure
  const fromName = data.smtp_from_name.trim() || 'GABLIMADOS Facturación'
  const fromEmail = data.smtp_from_email.trim() || user
  const dest = data.destinatario.trim() || sesion.email

  if (!host || !user || !pass) {
    throw new Error('Completa los campos SMTP antes de realizar la prueba.')
  }

  if (!dest) {
    throw new Error('Especifica un correo electrónico de destino para la prueba.')
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000 // 10 seconds timeout
    })

    // Verify connection
    await transporter.verify()

    // Send a test email
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: dest,
      subject: 'Prueba de Conexión de Correo Electrónico ⚙️📬',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff; color: #1f2937;">
          <h2 style="color: #10b981; margin-top: 0; font-size: 20px; font-weight: 800;">¡Prueba de Conexión Exitosa! ⚡</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">
            Este es un correo electrónico de prueba enviado de forma segura desde el panel de control de <strong>GABLIMADOS</strong>.
          </p>
          <p style="font-size: 13px; line-height: 1.6; color: #6b7280; background-color: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #f3f4f6;">
            Tu configuración SMTP está funcionando correctamente y el sistema está listo para enviar facturas electrónicas (XML y RIDE PDF) a tus clientes de manera directa.
          </p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 11px; color: #9ca3af; text-align: center; margin: 0;">
            GABLIMADOS — Calculadora de Sublimación y Facturación Electrónica PRO.
          </p>
        </div>
      `
    })

    return { success: true }
  } catch (error: any) {
    console.error('Error en prueba SMTP:', error)
    throw new Error(error.message || 'La prueba de conexión SMTP falló. Verifica tus credenciales.')
  }
}
