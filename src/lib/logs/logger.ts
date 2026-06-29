import { prisma } from '@/lib/db/prisma'
import { writeFileSync, appendFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { format } from 'date-fns'

type NivelLog = 'INFO' | 'WARN' | 'ERROR' | 'SECURITY' | 'AUDIT' | 'DEBUG'

// ─── Registrar log ────────────────────────────────────────────────────────────
export async function registrarLog(
  nivel: NivelLog,
  modulo: string,
  mensaje: string,
  meta?: Record<string, unknown>
) {
  const ahora = new Date()
  const timestamp = format(ahora, 'yyyy-MM-dd HH:mm:ss')
  const metaSanitizada = meta ? sanitizarMeta(meta) : undefined

  const linea = `[${timestamp}] [${nivel}] [${modulo}] ${mensaje}${metaSanitizada ? ' | ' + JSON.stringify(metaSanitizada) : ''}\n`

  // Escribir en archivo de log
  try {
    const dirLogs = join(process.cwd(), 'storage', 'logs')
    if (!existsSync(dirLogs)) {
      mkdirSync(dirLogs, { recursive: true })
    }
    const nombreArchivo = format(ahora, 'MMM-dd-yyyy').toLowerCase() + '.log'
    const rutaLog = join(dirLogs, nombreArchivo)
    appendFileSync(rutaLog, linea, 'utf-8')
  } catch {
    // Silencioso — no fallar por logs
  }

  // Guardar en BD (async, no bloqueante)
  if (nivel !== 'DEBUG') {
    try {
      await prisma.log.create({
        data: {
          nivel: nivel as any,
          modulo,
          mensaje,
          meta: metaSanitizada as any ?? undefined,
        },
      })
    } catch {
      // Silencioso
    }
  }
}

// ─── Sanitizar campos sensibles ───────────────────────────────────────────────
const CAMPOS_SENSIBLES = [
  'password', 'token', 'secret', 'authorization', 'cookie',
  'apiKey', 'accessToken', 'refreshToken', 'creditCard', 'cardNumber', 'cvv',
]

function sanitizarMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const sanitizado: Record<string, unknown> = {}
  for (const [clave, valor] of Object.entries(meta)) {
    if (CAMPOS_SENSIBLES.some(s => clave.toLowerCase().includes(s.toLowerCase()))) {
      sanitizado[clave] = '[REDACTED]'
    } else {
      sanitizado[clave] = valor
    }
  }
  return sanitizado
}
