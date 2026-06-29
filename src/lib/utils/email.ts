import nodemailer from 'nodemailer'
import { prisma } from '@/lib/db/prisma'
import { registrarLog } from '@/lib/logs/logger'

export async function enviarFacturaPorEmail(
  destinatario: string,
  numeroFactura: string,
  claveAcceso: string,
  pdfBase64: string,
  xmlContent: string
) {
  // Obtener configuraciones de SMTP desde la base de datos o env
  const configs = await prisma.configNegocio.findMany({
    where: {
      clave: {
        in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_secure', 'smtp_from', 'smtp_from_name', 'smtp_from_email']
      }
    }
  })

  const getConf = (key: string) => configs.find(c => c.clave === key)?.valor || ''

  const host = getConf('smtp_host') || process.env.SMTP_HOST
  const port = parseInt(getConf('smtp_port') || process.env.SMTP_PORT || '587', 10)
  const user = getConf('smtp_user') || process.env.SMTP_USER
  const pass = getConf('smtp_pass') || process.env.SMTP_PASS
  const secure = getConf('smtp_secure') === 'true' || process.env.SMTP_SECURE === 'true'
  
  const fromName = getConf('smtp_from_name') || process.env.SMTP_FROM_NAME || 'GABLIMADOS Facturación'
  const fromEmail = getConf('smtp_from_email') || getConf('smtp_from') || process.env.SMTP_FROM || user

  if (!host || !user || !pass) {
    throw new Error('La configuración SMTP de correo no está completa. Por favor configúrala en Configuración.')
  }

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
    }
  })

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: destinatario,
    subject: `Comprobante Electrónico Autorizado - Factura Nº ${numeroFactura}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff; color: #1f2937;">
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="color: #6366f1; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">GABLIMADOS</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 12px; uppercase; letter-spacing: 1px;">Facturación Electrónica</p>
        </div>
        
        <h2 style="font-size: 16px; font-weight: 700; color: #1f2937; margin-top: 0; margin-bottom: 12px;">Estimado(a) Cliente,</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin-bottom: 20px;">
          Le informamos que su comprobante electrónico ha sido emitido y autorizado con éxito por el **Servicio de Rentas Internas (SRI)**.
        </p>
        
        <div style="background-color: #f9fafb; padding: 18px; border-radius: 12px; margin: 20px 0; border: 1px solid #f3f4f6;">
          <table style="width: 100%; font-size: 13px; color: #4b5563; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #374151;">Factura Nº:</td>
              <td style="padding: 6px 0; text-align: right; font-family: monospace; font-weight: bold; color: #111827;">${numeroFactura}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #374151;">Clave de Acceso:</td>
              <td style="padding: 6px 0; text-align: right; font-family: monospace; font-size: 11px; color: #111827; word-break: break-all;">${claveAcceso}</td>
            </tr>
          </table>
        </div>
        
        <p style="font-size: 13px; line-height: 1.6; color: #6b7280; margin-bottom: 25px;">
          Adjunto a este correo encontrará la representación impresa (RIDE) de la factura en formato **PDF** y el archivo digital firmado **XML** para sus registros fiscales.
        </p>
        
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 25px 0;" />
        
        <p style="font-size: 11px; color: #9ca3af; text-align: center; margin: 0; line-height: 1.4;">
          Este es un correo automático generado de forma segura por el sistema de facturación de GABLIMADOS.<br />
          Por favor, no responda a este mensaje.
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `RIDE-${numeroFactura}.pdf`,
        content: pdfBase64,
        encoding: 'base64'
      },
      {
        filename: `FACTURA-${numeroFactura}.xml`,
        content: xmlContent
      }
    ]
  }

  await transporter.sendMail(mailOptions)
  await registrarLog('AUDIT', 'EMAIL', `Factura ${numeroFactura} enviada a ${destinatario}`)
}
