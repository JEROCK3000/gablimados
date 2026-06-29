'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  LayoutDashboard,
  Calculator,
  Package,
  Thermometer,
  FileBarChart,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Users,
  ShoppingCart,
  FileText,
} from 'lucide-react'
import { logoutAction } from '@/lib/auth/actions'
import { useState } from 'react'

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Resumen del negocio',
  },
  {
    href: '/calculadora',
    label: 'Calculadora',
    icon: Calculator,
    description: 'Calcular precios',
  },
  {
    href: '/productos',
    label: 'Productos',
    icon: Package,
    description: 'Mi catálogo',
  },
  {
    href: '/tiempos',
    label: 'Tiempos & Temps',
    icon: Thermometer,
    description: 'Base de datos',
  },
  {
    href: '/insumos',
    label: 'Insumos',
    icon: Package,
    description: 'Compras y Stock',
  },
  {
    href: '/reportes',
    label: 'Reportes',
    icon: FileBarChart,
    description: 'Excel y PDF',
  },
  {
    href: '/clientes',
    label: 'Clientes',
    icon: Users,
    description: 'Directorio',
  },
  {
    href: '/pedidos',
    label: 'Pedidos',
    icon: ShoppingCart,
    description: 'Ventas y cotizaciones',
  },
  {
    href: '/facturas',
    label: 'Facturas',
    icon: FileText,
    description: 'Historial y RIDE',
  },
  {
    href: '/configuracion',
    label: 'Configuración',
    icon: Settings,
    description: 'Costos fijos',
  },
]

interface SidebarProps {
  nombreUsuario: string
}

export function Sidebar({ nombreUsuario }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white p-1">
          <Image src="/logo.jpg" alt="Gablimados Logo" width={32} height={32} className="rounded-lg object-contain w-full h-full" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="text-white font-bold text-lg tracking-wide">GABLI</span>
            <span className="text-verde-400 font-bold text-lg tracking-wide">MADOS</span>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest">Sublimación PRO</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                ${isActive
                  ? 'bg-verde-500/20 text-verde-400 border border-verde-500/30'
                  : 'text-gray-400 hover:bg-white/8 hover:text-white'
                }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                size={18}
                className={`flex-shrink-0 transition-colors ${
                  isActive ? 'text-verde-400' : 'text-gray-500 group-hover:text-white'
                }`}
              />
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {!collapsed && isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-verde-400 flex-shrink-0" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Usuario y logout */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purpura-500 to-verde-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {nombreUsuario.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{nombreUsuario}</p>
              <p className="text-gray-500 text-[10px]">Administrador</p>
            </div>
          </div>
        )}
        <form action={logoutAction}>
          <button
            type="submit"
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium
              text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200
              ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Cerrar sesión' : undefined}
          >
            <LogOut size={17} className="flex-shrink-0" />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <>
      {/* Sidebar Desktop */}
      <aside
        className={`hidden lg:flex flex-col h-full bg-[#0a0a16] border-r border-white/5 sidebar-glow
          transition-all duration-300 flex-shrink-0
          ${collapsed ? 'w-16' : 'w-64'}`}
      >
        <SidebarContent />
        {/* Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute left-full top-1/2 -translate-y-1/2 ml-0.5 w-5 h-10 bg-[#0a0a16] border border-white/10 rounded-r-lg flex items-center justify-center text-gray-500 hover:text-white transition-colors z-10"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Mobile: hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 bg-[#0a0a16] border border-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white"
      >
        <Menu size={20} />
      </button>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-[#0a0a16] border-r border-white/5 z-50 flex flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10"
            >
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  )
}
