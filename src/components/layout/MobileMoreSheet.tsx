'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Target, RefreshCcw, BarChart3, Settings, Sun, Moon, Monitor, LogOut, X } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui.store'
import { signOut } from '@/app/(dashboard)/actions'

const MORE_ITEMS = [
  { href: '/goals',     label: 'Metas',         icon: Target },
  { href: '/recurring', label: 'Recurrentes',   icon: RefreshCcw },
  { href: '/reports',   label: 'Reportes',      icon: BarChart3 },
  { href: '/settings',  label: 'Configuración', icon: Settings },
] as const

interface Props {
  user: User | null
}

const avatarLetter = (user: User | null) => {
  const name = (user?.user_metadata?.['full_name'] as string | undefined) ?? user?.email ?? '?'
  return name[0]?.toUpperCase() ?? '?'
}

export function MobileMoreSheet({ user }: Props) {
  const { moreSheetOpen, setMoreSheetOpen } = useUIStore()
  const { setTheme, resolvedTheme } = useTheme()
  const [, startTransition] = useTransition()

  const avatarUrl = user?.user_metadata?.['avatar_url'] as string | undefined
  const displayName = (user?.user_metadata?.['full_name'] as string | undefined) ?? user?.email ?? ''

  function close() { setMoreSheetOpen(false) }

  function handleSignOut() {
    close()
    startTransition(async () => { await signOut() })
  }

  function cycleTheme() {
    if (resolvedTheme === 'dark') setTheme('light')
    else if (resolvedTheme === 'light') setTheme('system')
    else setTheme('dark')
  }

  const themeLabel = resolvedTheme === 'dark' ? 'Oscuro' : resolvedTheme === 'light' ? 'Claro' : 'Sistema'
  const ThemeIcon = resolvedTheme === 'dark' ? Moon : resolvedTheme === 'light' ? Sun : Monitor

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 z-40 bg-black/40 transition-opacity duration-300',
          moreSheetOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={close}
        aria-hidden
      />

      {/* Sheet panel */}
      <div
        className={cn(
          'lg:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background',
          'pb-safe transition-transform duration-300 ease-out',
          moreSheetOpen ? 'translate-y-0' : 'translate-y-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Más opciones"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-base font-semibold">Más opciones</span>
          <button
            onClick={close}
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* 2×2 grid */}
        <div className="grid grid-cols-2 gap-3 px-5 py-2">
          {MORE_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={close}
              className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              <Icon className="size-5 shrink-0" strokeWidth={1.75} />
              {label}
            </Link>
          ))}
        </div>

        {/* Theme + user + signout */}
        <div className="mx-5 mt-3 mb-4 space-y-2">
          <button
            onClick={cycleTheme}
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
          >
            <ThemeIcon className="size-5 shrink-0" strokeWidth={1.75} />
            <span>Apariencia</span>
            <span className="ml-auto text-xs text-muted-foreground">{themeLabel}</span>
          </button>

          {/* User card */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={displayName} className="size-9 rounded-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {avatarLetter(user)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-tight">{displayName}</p>
              {user?.email && <p className="truncate text-xs-plus text-muted-foreground">{user.email}</p>}
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="size-3.5" strokeWidth={1.75} />
              Salir
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
