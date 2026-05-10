'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useTransition } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  Home,
  ArrowLeftRight,
  PieChart,
  Target,
  BarChart3,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Sun,
  Moon,
  LogOut,
  RefreshCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui.store'
import { signOut } from '@/app/(dashboard)/actions'

const NAV_ITEMS = [
  { href: '/',             label: 'Dashboard',      icon: Home },
  { href: '/transactions', label: 'Transacciones',  icon: ArrowLeftRight },
  { href: '/budgets',      label: 'Presupuestos',   icon: PieChart },
  { href: '/recurring',    label: 'Recurrentes',    icon: RefreshCcw },
  { href: '/goals',        label: 'Metas',           icon: Target },
  { href: '/reports',      label: 'Reportes',        icon: BarChart3 },
  { href: '/settings',     label: 'Configuración',   icon: Settings },
] as const

interface Props {
  user: User | null
}

export function Sidebar({ user }: Props) {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { setTheme, resolvedTheme } = useTheme()
  const [, startTransition] = useTransition()

  const avatarUrl = user?.user_metadata?.['avatar_url'] as string | undefined
  const displayName =
    (user?.user_metadata?.['full_name'] as string | undefined) ?? user?.email ?? ''
  const initials = displayName[0]?.toUpperCase() ?? '?'

  function handleSignOut() {
    startTransition(async () => {
      await signOut()
    })
  }

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col shrink-0 h-screen sticky top-0',
        'border-r bg-sidebar transition-[width] duration-200 ease-in-out overflow-hidden',
        sidebarOpen ? 'w-60' : 'w-16',
      )}
    >
      {/* User avatar / app identity */}
      <div
        className={cn(
          'flex items-center gap-3 border-b py-4',
          sidebarOpen ? 'px-4' : 'justify-center px-0',
        )}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            className="size-8 shrink-0 rounded-full object-cover ring-2 ring-sidebar-border"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
            {initials}
          </span>
        )}
        {sidebarOpen && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-sidebar-foreground leading-tight">
              {displayName}
            </p>
            <p className="truncate text-[11px] text-sidebar-foreground/60">{user?.email}</p>
          </div>
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

      {/* Theme + sign-out */}
      <div className="border-t px-2 py-2 space-y-0.5">
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            !sidebarOpen && 'justify-center px-0',
          )}
          title={!sidebarOpen ? (resolvedTheme === 'dark' ? 'Modo claro' : 'Modo oscuro') : undefined}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="size-4 shrink-0" />
          ) : (
            <Moon className="size-4 shrink-0" />
          )}
          {sidebarOpen && (
            <span>{resolvedTheme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
          )}
        </button>

        <button
          onClick={handleSignOut}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            'text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive',
            !sidebarOpen && 'justify-center px-0',
          )}
          title={!sidebarOpen ? 'Cerrar sesión' : undefined}
        >
          <LogOut className="size-4 shrink-0" />
          {sidebarOpen && <span>Cerrar sesión</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'flex items-center gap-2 border-t px-4 py-3 text-xs text-sidebar-foreground/50',
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
