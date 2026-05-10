'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, ArrowLeftRight, PieChart, Target, RefreshCcw, BarChart3, Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/',             label: 'Inicio',       icon: Home },
  { href: '/transactions', label: 'Movimientos',  icon: ArrowLeftRight },
  { href: '/budgets',      label: 'Presupuestos', icon: PieChart },
  { href: '/goals',        label: 'Metas',        icon: Target },
  { href: '/recurring',    label: 'Recurrentes',  icon: RefreshCcw },
  { href: '/reports',      label: 'Reportes',     icon: BarChart3 },
  { href: '/settings',     label: 'Config.',      icon: Settings },
] as const

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 backdrop-blur safe-bottom">
      {/* Horizontally scrollable — all 7 items fit; swipe to reveal any that overflow */}
      <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex shrink-0 flex-col items-center gap-0.5 px-3.5 py-2 text-[9px] font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-[18px]" />
              <span className="whitespace-nowrap">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
