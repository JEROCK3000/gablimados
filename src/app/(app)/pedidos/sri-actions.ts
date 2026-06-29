'use server'

import { prisma } from '@/lib/db/prisma'
import { registrarLog } from '@/lib/logs/logger'
import { obtenerSesion } from '@/lib/auth/jwt'
import { enviarFacturaPorEmail } from '@/lib/utils/email'
import { revalidatePath } from 'next/cache'
import { 
  generateInvoice, 
  generateInvoiceXml, 
  getP12FromLocalFile, 
  documentReception, 
  documentAuthorization 
} from 'open-factura'
import { signInvoiceXml } from 'ec-sri-invoice-signer'
import { format } from 'date-fns'

const ENDPOINTS_SRI = {
  pruebas: {
    recepcion: 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
    autorizacion: 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl',
  },
  produccion: {
    recepcion: 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
    autorizacion: 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl',
  }
}

function mapTipoIdentificacion(tipo: string): "04" | "05" | "06" | "07" | "08" {
  if (tipo === 'RUC') return '04'
  if (tipo === 'CEDULA') return '05'
  if (tipo === 'PASAPORTE') return '06'
  if (tipo === 'CONSUMIDOR_FINAL') return '07'
  return '08'
}

async function calcularSiguienteSecuencial(): Promise<string> {
  const facturas = await prisma.facturaSRI.findMany({
    select: { claveAcceso: true }
  })
  let maxSecuencial = 0
  for (const f of facturas) {
    const seqStr = f.claveAcceso.substring(30, 39)
    const seqInt = parseInt(seqStr, 10)
    if (!isNaN(seqInt) && seqInt > maxSecuencial) {
      maxSecuencial = seqInt
    }
  }
  return String(maxSecuencial + 1).padStart(9, '0')
}

export async function emitirFacturaSRIAction(pedidoId: number) {
  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        cliente: true,
        items: {
          include: { producto: true }
        },
        facturaSRI: true,
      }
    })

    if (!pedido) {
      throw new Error('Pedido no encontrado')
    }

    if (pedido.facturaSRI && pedido.facturaSRI.estado === 'AUTORIZADA') {
      throw new Error('Este pedido ya posee una factura autorizada por el SRI')
    }

    const emisor = await prisma.emisorSRI.findFirst()
    if (!emisor) {
      throw new Error('Los datos del emisor SRI no están configurados. Ve a Configuración > Facturación SRI.')
    }

    const endpoints = emisor.ambiente === 1 ? ENDPOINTS_SRI.pruebas : ENDPOINTS_SRI.produccion

    // Si ya existe una facturaSRI creada con claveAcceso, intentar consultar primero en el SRI
    if (pedido.facturaSRI && pedido.facturaSRI.claveAcceso) {
      try {
        const authResult = await documentAuthorization(pedido.facturaSRI.claveAcceso, endpoints.autorizacion)
        const respuestaAuth = authResult.RespuestaAutorizacionComprobante || authResult
        const autorizaciones = respuestaAuth.autorizaciones?.autorizacion
        const autorizacion = Array.isArray(autorizaciones) ? autorizaciones[0] : autorizaciones
        
        if (autorizacion && (autorizacion.estado === 'AUTORIZADO' || autorizacion.estado === 'AUTORIZADA')) {
          await prisma.facturaSRI.update({
            where: { pedidoId: pedido.id },
            data: {
              estado: 'AUTORIZADA',
              numeroAutorizacion: autorizacion.numeroAutorizacion,
              xmlFirmado: autorizacion.comprobante,
              fechaAutorizacion: new Date(autorizacion.fechaAutorizacion),
              mensajeError: null,
            }
          })
          if (pedido.estado !== 'VENTA') {
            await prisma.pedido.update({
              where: { id: pedidoId },
              data: { estado: 'LISTO' }
            })
          }
          await registrarLog('AUDIT', 'PEDIDOS', `Factura SRI AUTORIZADA mediante consulta previa para Pedido ID ${pedidoId}`)
          revalidatePath('/pedidos')
          return { success: true, accessKey: pedido.facturaSRI.claveAcceso, numeroAutorizacion: autorizacion.numeroAutorizacion }
        }
      } catch (err) {
        console.error('Error en consulta de autorización previa, procediendo a emitir nuevamente:', err)
      }
    }

    const secuencial = await calcularSiguienteSecuencial()

    const subtotalNeto = Number(pedido.subtotal) - Number(pedido.descuento)

    const invoiceInput = {
      infoTributaria: {
        ambiente: String(emisor.ambiente) as "1" | "2",
        tipoEmision: "1",
        razonSocial: emisor.razonSocial,
        nombreComercial: emisor.nombreComercial || emisor.razonSocial,
        ruc: emisor.ruc,
        codDoc: "01" as "01",
        estab: emisor.codigoEstablecimiento,
        ptoEmi: emisor.codigoPuntoEmision,
        secuencial,
        dirMatriz: emisor.dirMatriz,
        agenteRetencion: emisor.agenteRetencion || undefined,
      },
      infoFactura: {
        fechaEmision: format(new Date(), 'dd/MM/yyyy'),
        dirEstablecimiento: emisor.dirEstablecimiento,
        contribuyenteEspecial: emisor.contribuyenteEspecial || undefined,
        obligadoContabilidad: emisor.obligadoContabilidad ? ("SI" as const) : ("NO" as const),
        tipoIdentificacionComprador: mapTipoIdentificacion(pedido.cliente.tipoIdentificacion),
        razonSocialComprador: pedido.cliente.nombre,
        identificacionComprador: pedido.cliente.identificacion,
        direccionComprador: pedido.cliente.direccion || emisor.dirEstablecimiento,
        totalSinImpuestos: subtotalNeto.toFixed(2),
        totalDescuento: Number(pedido.descuento).toFixed(2),
        totalConImpuestos: {
          totalImpuesto: [
            {
              codigo: "2" as const,
              codigoPorcentaje: "4" as any,
              descuentoAdicional: "0.00",
              baseImponible: subtotalNeto.toFixed(2),
              tarifa: "15.00",
              valor: Number(pedido.iva).toFixed(2),
            }
          ]
        },
        importeTotal: Number(pedido.total).toFixed(2),
        moneda: "DOLAR",
        pagos: {
          pago: [
            {
              formaPago: pedido.formaPago,
              total: Number(pedido.total).toFixed(2),
              plazo: "0",
              unidadTiempo: "dias"
            }
          ]
        }
      },
      detalles: {
        detalle: pedido.items.map(item => {
          const itemSubtotal = Number(item.subtotal)
          const factorDescuento = Number(pedido.subtotal) > 0 ? (Number(pedido.descuento) / Number(pedido.subtotal)) : 0
          const descuentoItem = itemSubtotal * factorDescuento
          const precioTotalSinImpuesto = itemSubtotal - descuentoItem

          return {
            codigoPrincipal: String(item.productoId),
            codigoAuxiliar: String(item.productoId),
            descripcion: item.producto.nombre,
            cantidad: String(item.cantidad),
            precioUnitario: Number(item.precioUnitario).toFixed(4),
            descuento: descuentoItem.toFixed(2),
            precioTotalSinImpuesto: precioTotalSinImpuesto.toFixed(2),
            impuestos: {
              impuesto: [
                {
                  codigo: "2",
                  codigoPorcentaje: "4",
                  tarifa: "15",
                  baseImponible: precioTotalSinImpuesto.toFixed(2),
                  valor: (precioTotalSinImpuesto * 0.15).toFixed(2)
                }
              ]
            }
          }
        })
      }
    }

    const { invoice, accessKey } = generateInvoice(invoiceInput)
    const xml = generateInvoiceXml(invoice)

    // Limpiar namespaces del nodo raíz exigido por ec-sri-invoice-signer
    const cleanedXml = xml
      .replace(' xmlns:ds="http://www.w3.org/2000/09/xmldsig#"', '')
      .replace(' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"', '')

    let p12Buffer: any
    try {
      p12Buffer = getP12FromLocalFile(emisor.rutaFirma)
    } catch (err: any) {
      throw new Error(`No se pudo leer el archivo de firma en ${emisor.rutaFirma}. Asegúrate de haberla subido correctamente.`)
    }

    let signedXml: string
    try {
      signedXml = signInvoiceXml(cleanedXml, Buffer.from(p12Buffer), { pkcs12Password: emisor.passwordFirma })
    } catch (err: any) {
      throw new Error(`Error al firmar el XML con la clave provista: ${err.message || err}`)
    }

    let receptionResult: any
    try {
      receptionResult = await documentReception(signedXml, endpoints.recepcion)
    } catch (err: any) {
      throw new Error(`Error de conexión con el servicio de Recepción del SRI: ${err.message || err}`)
    }

    if (receptionResult) {
      const respuestaRec = receptionResult.RespuestaRecepcionComprobante || receptionResult
      console.log('SRI RECEPTION RESPONSE:', JSON.stringify(respuestaRec, null, 2))
      if (respuestaRec.estado === 'DEVUELTA') {
        const comprobantes = respuestaRec.comprobantes?.comprobante
        const comprobante = Array.isArray(comprobantes) ? comprobantes[0] : comprobantes
        const msgs = comprobante?.mensajes?.mensaje || []
        const errTexto = Array.isArray(msgs)
          ? msgs.map((m: any) => `${m.mensaje}: ${m.informacionAdicional || ''}`).join(' | ')
          : `${msgs.mensaje || ''}: ${msgs.informacionAdicional || ''}`
        throw new Error(`SRI Recepción Devuelta: ${errTexto}`)
      }
    }

    await new Promise(resolve => setTimeout(resolve, 2500))

    let autorizacion: any = null
    // Realizar hasta 5 intentos de consulta de autorización (cada 2 segundos)
    for (let intento = 1; intento <= 5; intento++) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      try {
        const authResult = await documentAuthorization(accessKey, endpoints.autorizacion)
        const respuestaAuth = authResult.RespuestaAutorizacionComprobante || authResult
        console.log('SRI AUTH RESPONSE:', JSON.stringify(respuestaAuth, null, 2))
        const autorizaciones = respuestaAuth.autorizaciones?.autorizacion
        const tempAuth = Array.isArray(autorizaciones) ? autorizaciones[0] : autorizaciones
        
        if (tempAuth && tempAuth.estado !== 'PENDIENTE') {
          autorizacion = tempAuth
          break
        }
      } catch (err: any) {
        console.error(`Intento ${intento} de consulta de autorización falló:`, err)
      }
    }

    if (!autorizacion) {
      await prisma.facturaSRI.upsert({
        where: { pedidoId },
        update: {
          claveAcceso: accessKey,
          estado: 'PENDIENTE',
          mensajeError: 'El SRI está demorando en procesar el comprobante. Por favor vuelve a consultar en unos minutos.',
        },
        create: {
          pedidoId,
          claveAcceso: accessKey,
          estado: 'PENDIENTE',
          mensajeError: 'El SRI está demorando en procesar el comprobante. Por favor vuelve a consultar en unos minutos.',
        }
      })
      revalidatePath('/pedidos')
      throw new Error('El SRI está demorando en procesar el comprobante (quedó como PENDIENTE). Por favor vuelve a intentar en unos minutos para actualizar el estado.')
    }

    const estadoSRI = autorizacion.estado
    if (estadoSRI === 'AUTORIZADO' || estadoSRI === 'AUTORIZADA') {
      await prisma.facturaSRI.upsert({
        where: { pedidoId },
        update: {
          claveAcceso: accessKey,
          numeroAutorizacion: autorizacion.numeroAutorizacion,
          estado: 'AUTORIZADA',
          xmlFirmado: autorizacion.comprobante,
          fechaAutorizacion: new Date(autorizacion.fechaAutorizacion),
          mensajeError: null,
        },
        create: {
          pedidoId,
          claveAcceso: accessKey,
          numeroAutorizacion: autorizacion.numeroAutorizacion,
          estado: 'AUTORIZADA',
          xmlFirmado: autorizacion.comprobante,
          fechaAutorizacion: new Date(autorizacion.fechaAutorizacion),
        }
      })

      if (pedido.estado !== 'VENTA') {
        await prisma.pedido.update({
          where: { id: pedidoId },
          data: { estado: 'LISTO' }
        })
      }

      await registrarLog('AUDIT', 'PEDIDOS', `Factura SRI AUTORIZADA para Pedido ID ${pedidoId} (Clave: ${accessKey})`)
      revalidatePath('/pedidos')
      return { success: true, accessKey, numeroAutorizacion: autorizacion.numeroAutorizacion }
    } else {
      const msgs = autorizacion.mensajes?.mensaje || []
      const errTexto = Array.isArray(msgs)
        ? msgs.map((m: any) => `${m.mensaje}: ${m.informacionAdicional || ''}`).join(' | ')
        : `${msgs.mensaje || ''}: ${msgs.informacionAdicional || ''}`

      await prisma.facturaSRI.upsert({
        where: { pedidoId },
        update: {
          claveAcceso: accessKey,
          estado: 'RECHAZADA',
          mensajeError: errTexto,
        },
        create: {
          pedidoId,
          claveAcceso: accessKey,
          estado: 'RECHAZADA',
          mensajeError: errTexto,
        }
      })

      await registrarLog('ERROR', 'PEDIDOS', `Factura SRI RECHAZADA para Pedido ID ${pedidoId}: ${errTexto}`)
      revalidatePath('/pedidos')
      throw new Error(`SRI Autorización Rechazada: ${errTexto}`)
    }
  } catch (error: any) {
    console.error('Error en emitirFacturaSRIAction:', error)
    await registrarLog('ERROR', 'PEDIDOS', `Error al emitir factura SRI: ${error.message || error}`)
    throw new Error(error.message || 'Error desconocido al emitir factura SRI')
  }
}

export async function obtenerVistaPreviaFactura(pedidoId: number) {
  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        cliente: true,
        items: {
          include: { producto: true }
        },
        facturaSRI: true,
      }
    })

    if (!pedido) {
      throw new Error('Pedido no encontrado')
    }

    const emisor = await prisma.emisorSRI.findFirst()
    if (!emisor) {
      throw new Error('Los datos del emisor SRI no están configurados.')
    }

    const secuencial = await calcularSiguienteSecuencial()

    const numeroFactura = `${emisor.codigoEstablecimiento}-${emisor.codigoPuntoEmision}-${secuencial}`

    return {
      success: true,
      emisor: {
        ruc: emisor.ruc,
        razonSocial: emisor.razonSocial,
        establecimiento: emisor.codigoEstablecimiento,
        puntoEmision: emisor.codigoPuntoEmision,
        ambiente: emisor.ambiente === 1 ? 'PRUEBAS' : 'PRODUCCIÓN',
      },
      cliente: {
        nombre: pedido.cliente.nombre,
        identificacion: pedido.cliente.identificacion,
        tipoIdentificacion: pedido.cliente.tipoIdentificacion,
        direccion: pedido.cliente.direccion,
        email: pedido.cliente.email,
      },
      pedido: {
        numero: pedido.numero,
        fecha: format(pedido.createdAt, 'dd/MM/yyyy'),
        subtotal: Number(pedido.subtotal),
        descuento: Number(pedido.descuento),
        iva: Number(pedido.iva),
        total: Number(pedido.total),
        formaPago: pedido.formaPago,
        items: pedido.items.map(it => ({
          nombre: it.producto.nombre,
          cantidad: it.cantidad,
          precioUnitario: Number(it.precioUnitario),
          subtotal: Number(it.subtotal),
        }))
      },
      secuencial,
      numeroFactura,
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error al obtener vista previa de factura')
  }
}

export async function enviarFacturaEmailAction(pedidoId: number, pdfBase64: string) {
  try {
    const sesion = await obtenerSesion()
    if (!sesion) {
      throw new Error('No autorizado')
    }

    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        cliente: true,
        facturaSRI: true
      }
    })

    if (!pedido || !pedido.facturaSRI) {
      throw new Error('Pedido o factura no encontrados')
    }

    const { cliente, facturaSRI } = pedido
    if (!cliente.email) {
      throw new Error('El cliente no posee un correo electrónico registrado.')
    }

    if (facturaSRI.estado !== 'AUTORIZADA') {
      throw new Error('El comprobante debe estar en estado AUTORIZADA para poder ser enviado.')
    }

    const estab = facturaSRI.claveAcceso.substring(24, 27)
    const ptoEmi = facturaSRI.claveAcceso.substring(27, 30)
    const seq = facturaSRI.claveAcceso.substring(30, 39)
    const numeroFactura = `${estab}-${ptoEmi}-${seq}`

    await enviarFacturaPorEmail(
      cliente.email,
      numeroFactura,
      facturaSRI.claveAcceso,
      pdfBase64,
      facturaSRI.xmlFirmado || ''
    )

    return { success: true }
  } catch (error: any) {
    console.error('Error al enviar email de factura:', error)
    throw new Error(error.message || 'Error al enviar la factura por correo')
  }
}
