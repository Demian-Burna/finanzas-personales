'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  ArrowLeftRight,
  PieChart,
  Target,
  BarChart3,
  Settings,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui.store'

const NAV_ITEMS = [
  { href: '/',             label: 'Dashboard',      icon: Home },
  { href: '/transactions', label: 'Transacciones',  icon: ArrowLeftRight },
  { href: '/budgets',      label: 'Presupuestos',   icon: PieChart },
  { href: '/goals',        label: 'Metas',           icon: Target },
  { href: '/reports',      label: 'Reportes',        icon: BarChart3 },
  { href: '/settings',     label: 'Configuración',   icon: Settings },
] as const

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar } = useUIStore()

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col shrink-0 h-screen sticky top-0',
        'border-r bg-sidebar transition-[width] duration-200 ease-in-out overflow-hidden',
        sidebarOpen ? 'w-60' : 'w-16',
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b', !sidebarOpen && 'justify-center px-0')}>
        <span className="text-xl shrink-0">💰</span>
        {sidebarOpen && (
          <span className="font-semibold text-sm text-sidebar-foreground truncate">
            Finanzas Personales
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 space-y-0.5 px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70',
                !sidebarOpen && 'justify-center px-0',
              )}
              title={!sidebarOpen ? label : undefined}
            >
              <Icon className="size-4 shrink-0" />
              {sidebarOpen && <span className="truncate">{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'flex items-center gap-2 px-4 py-3 border-t text-xs text-sidebar-foreground/50',
          'hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors',
          !sidebarOpen && 'justify-center px-0',
        )}
        aria-label={sidebarOpen ? 'Colapsar sidebar' : 'Expandir sidebar'}
      >
        {sidebarOpen ? (
          <>
            <ChevronsLeft className="size-4 shrink-0" />
            <span>Colapsar</span>
          </>
        ) : (
          <ChevronsRight className="size-4 shrink-0" />
        )}
      </button>
    </aside>
  )
}
