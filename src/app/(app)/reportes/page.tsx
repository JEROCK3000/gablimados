import type { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { obtenerSesion } from '@/lib/auth/jwt'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileSpreadsheet, FileText, Download, TrendingUp, ShoppingCart, DollarSign, Coins, CreditCard, ShieldCheck, ShieldAlert, Clock, ArrowUpRight } from 'lucide-react'
import { format } from 'date-fns'

export const metadata: Metadata = {
  title: 'Reportes — GABLIMADOS',
}

export default async function ReportesPage() {
  const sesion = await obtenerSesion()
  if (!sesion) redirect('/login')

  const [totalProductos, totalCalculos, totalVentas, totalSumRes, pedidosRecientes] = await Promise.all([
    prisma.producto.count({ where: { activo: true } }),
    prisma.calculo.count(),
    prisma.pedido.count(),
    prisma.pedido.aggregate({
      _sum: {
        total: true,
        subtotal: true,
        iva: true,
        descuento: true
      }
    }),
    prisma.pedido.findMany({
      include: { cliente: true, facturaSRI: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
  ])

  const totalIngresos = Number(totalSumRes._sum.total || 0)
  const totalIva = Number(totalSumRes._sum.iva || 0)
  const totalDescuento = Number(totalSumRes._sum.descuento || 0)
  const ticketPromedio = totalVentas > 0 ? totalIngresos / totalVentas : 0
  const mapPagoSRI = (code: string) => {
    if (code === '01') return 'Efectivo'
    if (code === '16') return 'T. Débito'
    if (code === '19') return 'T. Crédito'
    if (code === '20') return 'Transferencia/Cheque'
    return 'Otros'
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white">
          Reportes 📊
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Genera reportes profesionales de tu negocio
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Ventas */}
        <div className="card hover:shadow-lg transition-all duration-200 border border-white/5 bg-[#0f0f23]/60 flex flex-col justify-between">
          <div>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet size={24} className="text-indigo-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Reporte de Ventas</h3>
                <p className="text-sm text-gray-500 mt-0.5">Excel (.xlsx)</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Historial completo de pedidos con clientes, formas de pago, totales y estados de facturación del SRI.
              Incluye {totalVentas} pedidos.
            </p>
            <div className="flex gap-2 flex-wrap text-xs text-gray-500 mb-4">
              {['Clientes y RUC', 'Formas de pago', 'Estados SRI', 'Totales e IVA'].map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5">{tag}</span>
              ))}
            </div>
          </div>
          <a
            href="/api/reportes/ventas"
            id="btn-descargar-ventas"
            className="btn-primary flex items-center justify-center gap-2 w-full mt-auto cursor-pointer"
          >
            <Download size={16} />
            Descargar Reporte Ventas
          </a>
        </div>

        {/* Excel */}
        <div className="card hover:shadow-lg transition-all duration-200 border border-white/5 bg-[#0f0f23]/60 flex flex-col justify-between">
          <div>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/15 flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet size={24} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Lista de Precios</h3>
                <p className="text-sm text-gray-500 mt-0.5">Excel (.xlsx)</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Exporta tu catálogo completo con costos, precios sugeridos y márgenes.
              Incluye {totalProductos} productos activos.
            </p>
            <div className="flex gap-2 flex-wrap text-xs text-gray-500 mb-4">
              {['Nombre y categoría', 'Costo total', 'Precio mínimo', 'Precio sugerido', 'Margen %'].map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5">{tag}</span>
              ))}
            </div>
          </div>
          <a
            href="/api/reportes/excel"
            id="btn-descargar-excel"
            className="btn-secondary flex items-center justify-center gap-2 w-full mt-auto cursor-pointer bg-[#0f0f23]/40"
          >
            <Download size={16} />
            Descargar Lista Precios
          </a>
        </div>

        {/* PDF */}
        <div className="card hover:shadow-lg transition-all duration-200 border border-white/5 bg-[#0f0f23]/60 flex flex-col justify-between">
          <div>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
                <FileText size={24} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Reporte de Costos</h3>
                <p className="text-sm text-gray-500 mt-0.5">PDF Profesional</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Reporte completo con costos fijos, análisis de márgenes y últimos cálculos realizados.
              {totalCalculos} cálculos en historial.
            </p>
            <div className="flex gap-2 flex-wrap text-xs text-gray-500 mb-4">
              {['Costos fijos del mes', 'Análisis de márgenes', 'Historial de cálculos', 'Fecha de generación'].map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5">{tag}</span>
              ))}
            </div>
          </div>
          <a
            href="/api/reportes/pdf"
            id="btn-descargar-pdf"
            className="btn-secondary flex items-center justify-center gap-2 w-full mt-auto cursor-pointer bg-[#0f0f23]/40"
          >
            <Download size={16} />
            Descargar PDF Costos
          </a>
        </div>
      </div>

      {/* ─── Estadísticas de Ventas en Vivo ──────────────────────────────────── */}
      <div className="space-y-4 pt-4 border-t border-white/5">
        <div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
            Panel de Ventas en Vivo 📈
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
            Métricas clave y desglose financiero en tiempo real dentro del sistema
          </p>
        </div>

        {/* Grid de Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Ingresos */}
          <div className="card border border-white/5 bg-[#0f0f23]/60 flex items-center justify-between p-4.5">
            <div>
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ingresos Totales</p>
              <h4 className="text-xl font-black text-verde-400 mt-1">${totalIngresos.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</h4>
              <p className="text-[10px] text-gray-400 mt-0.5">Bruto acumulado</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center flex-shrink-0 border border-green-500/20">
              <DollarSign size={18} />
            </div>
          </div>

          {/* Pedidos */}
          <div className="card border border-white/5 bg-[#0f0f23]/60 flex items-center justify-between p-4.5">
            <div>
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pedidos Procesados</p>
              <h4 className="text-xl font-black text-indigo-400 mt-1">{totalVentas}</h4>
              <p className="text-[10px] text-gray-400 mt-0.5">Transacciones totales</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
              <ShoppingCart size={18} />
            </div>
          </div>

          {/* Ticket Promedio */}
          <div className="card border border-white/5 bg-[#0f0f23]/60 flex items-center justify-between p-4.5">
            <div>
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ticket Promedio</p>
              <h4 className="text-xl font-black text-purpura-400 mt-1">${ticketPromedio.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</h4>
              <p className="text-[10px] text-gray-400 mt-0.5">Valor medio por compra</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purpura-500/10 text-purpura-400 flex items-center justify-center flex-shrink-0 border border-purpura-500/20">
              <TrendingUp size={18} />
            </div>
          </div>

          {/* IVA Recaudado */}
          <div className="card border border-white/5 bg-[#0f0f23]/60 flex items-center justify-between p-4.5">
            <div>
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">IVA Recaudado (15%)</p>
              <h4 className="text-xl font-black text-amber-400 mt-1">${totalIva.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</h4>
              <p className="text-[10px] text-red-400/90 mt-0.5">Desc: -${totalDescuento.toFixed(2)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
              <Coins size={18} />
            </div>
          </div>
        </div>

        {/* Tabla Ventas Recientes */}
        <div className="card p-0 overflow-hidden border border-white/5 bg-[#0f0f23]/60 shadow-xl">
          <div className="p-4 border-b border-white/5 bg-[#0e0e1e]/60 flex justify-between items-center">
            <h4 className="font-bold text-white text-sm">Historial de Últimas Ventas</h4>
            <span className="text-[10px] font-bold text-gray-400 uppercase">Mostrando las últimas 10</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-gray-400 text-[10px] font-bold uppercase bg-[#0e0e1e]/40">
                  <th className="p-3">Pedido</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Forma Pago</th>
                  <th className="p-3 text-center">Estado SRI</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-gray-300">
                {pedidosRecientes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No se registran ventas en el sistema.
                    </td>
                  </tr>
                ) : (
                  pedidosRecientes.map((p) => {
                    const isAutorizada = p.facturaSRI?.estado === 'AUTORIZADA'
                    const isPendiente = p.facturaSRI?.estado === 'PENDIENTE'
                    const isRechazada = p.facturaSRI?.estado === 'RECHAZADA'

                    return (
                      <tr key={p.id} className="hover:bg-white/1">
                        <td className="p-3 font-bold text-white flex items-center gap-1">
                          {p.facturaSRI ? (
                            <Link href={`/facturas/${p.facturaSRI.id}`} className="hover:text-purpura-400 hover:underline flex items-center gap-0.5">
                              {p.numero} <ArrowUpRight size={10} />
                            </Link>
                          ) : (
                            p.numero
                          )}
                        </td>
                        <td className="p-3 text-gray-400">{format(p.createdAt, 'dd/MM/yyyy')}</td>
                        <td className="p-3">
                          <div className="font-semibold text-white">{p.cliente.nombre}</div>
                          <span className="text-[10px] text-gray-400">{p.cliente.identificacion}</span>
                        </td>
                        <td className="p-3">{mapPagoSRI(p.formaPago)}</td>
                        <td className="p-3 text-center">
                          {p.facturaSRI ? (
                            <>
                              {isAutorizada && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                                  <ShieldCheck size={10} /> Autorizada
                                </span>
                              )}
                              {isPendiente && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  <Clock size={10} className="animate-pulse" /> Pendiente
                                </span>
                              )}
                              {isRechazada && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                  <ShieldAlert size={10} /> Rechazada
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-500/10 text-gray-400 border border-white/5">
                              Sin Emitir
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right font-black text-white">
                          ${Number(p.total).toFixed(2)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="card bg-gray-50/50 dark:bg-white/2">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">📋 Sobre los reportes</h4>
        <ul className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
          <li>• Los reportes se generan con la información actual del sistema</li>
          <li>• El Excel incluye formato profesional con colores y totales</li>
          <li>• El PDF incluye encabezado, logo del negocio y numeración de páginas</li>
          <li>• Se genera un log de cada descarga para auditoría</li>
        </ul>
      </div>
    </div>
  )
}
