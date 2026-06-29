'use client'

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts'
import { FileBarChart, CreditCard } from 'lucide-react'

interface Props {
  datosMensuales: { name: string; Ventas: number }[]
  datosMetodosPago: { name: string; value: number }[]
}

const COLORES_METODOS = ['#10B981', '#6366F1', '#8B5CF6', '#F59E0B', '#EF4444']

export function DashboardCharts({ datosMensuales, datosMetodosPago }: Props) {
  const tieneVentas = datosMensuales.some(d => d.Ventas > 0)
  const tieneMetodos = datosMetodosPago.length > 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Gráfico de Tendencia de Ventas (AreaChart) */}
      <div className="card lg:col-span-2 space-y-4 border border-white/5 bg-[#0f0f23]/60">
        <div className="flex items-center gap-2 mb-2">
          <FileBarChart size={18} className="text-verde-500" />
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">Tendencia de Ventas Mensuales</h3>
        </div>

        {!tieneVentas ? (
          <div className="h-64 flex flex-col items-center justify-center text-center text-gray-500 text-xs">
            No se registran ventas para graficar en el año actual.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={datosMensuales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  stroke="#6B7280" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#6B7280" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f0f23', 
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                    fontFamily: 'inherit'
                  }}
                  formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Ventas']}
                />
                <Area 
                  type="monotone" 
                  dataKey="Ventas" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorVentas)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Gráfico de Métodos de Pago (PieChart) */}
      <div className="card space-y-4 border border-white/5 bg-[#0f0f23]/60 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={18} className="text-purpura-500" />
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Métodos de Pago Utilizados</h3>
          </div>

          {!tieneMetodos ? (
            <div className="h-56 flex flex-col items-center justify-center text-center text-gray-500 text-xs">
              Sin datos de pago registrados.
            </div>
          ) : (
            <div className="h-56 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={datosMetodosPago}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {datosMetodosPago.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORES_METODOS[index % COLORES_METODOS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#0f0f23', 
                      borderColor: 'rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11px',
                      fontFamily: 'inherit'
                    }}
                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Monto']}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
