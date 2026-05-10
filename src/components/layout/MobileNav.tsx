'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ArrowLeftRight, PieChart, BarChart3, RefreshCcw, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/',             label: 'Inicio',       icon: Home },
  { href: '/transactions', label: 'Movimientos',  icon: ArrowLeftRight },
  { href: '/budgets',      label: 'Presupuestos', icon: PieChart },
  { href: '/recurring',    label: 'Recurrentes',  icon: RefreshCcw },
  { href: '/reports',      label: 'Reportes',     icon: BarChart3 },
  { href: '/settings',     label: 'Config.',      icon: Settings },
] as const

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background safe-bottom">
      <div className="flex">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[9px] font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-[18px]" />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
