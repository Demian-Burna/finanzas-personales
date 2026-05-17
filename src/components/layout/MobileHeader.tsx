'use client'

import { Suspense } from 'react'
import { Bell } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui.store'
import { PeriodSelector } from './PeriodSelector'

interface Props {
  user: User | null
}

const avatarLetter = (user: User | null) => {
  const name = (user?.user_metadata?.['full_name'] as string | undefined) ?? user?.email ?? '?'
  return name[0]?.toUpperCase() ?? '?'
}

// Period selector is shown on dashboard, transactions, and budgets
const PERIOD_ROUTES = ['/', '/transactions', '/budgets']

function MobileHeaderInner({ user }: Props) {
  const pathname = usePathname()
  const { setMoreSheetOpen, setNotificationsOpen } = useUIStore()

  const avatarUrl = user?.user_metadata?.['avatar_url'] as string | undefined
  const displayName = (user?.user_metadata?.['full_name'] as string | undefined) ?? user?.email ?? ''

  const showPeriod = PERIOD_ROUTES.some((r) =>
    r === '/' ? pathname === '/' : pathname.startsWith(r),
  )

  return (
    <header className="lg:hidden sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-sm">
      {/* Avatar → opens MoreSheet */}
      <button
        onClick={() => setMoreSheetOpen(true)}
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full ring-2 ring-border',
          'hover:ring-primary/50 transition-all focus:outline-none',
        )}
        aria-label="Abrir menú"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            className="size-8 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {avatarLetter(user)}
          </span>
        )}
      </button>

      {/* Center — PeriodSelector on relevant pages, app name otherwise */}
      <div className="flex flex-1 items-center justify-center">
        {showPeriod ? (
          <PeriodSelector />
        ) : (
          <span className="text-sm font-semibold">Finanzas</span>
        )}
      </div>

      {/* Bell → opens NotificationsDrawer (placeholder until Step 10) */}
      <button
        onClick={() => setNotificationsOpen(true)}
        className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="size-5" strokeWidth={1.75} />
      </button>
    </header>
  )
}

export function MobileHeader({ user }: Props) {
  return (
    <Suspense fallback={
      <header className="lg:hidden sticky top-0 z-40 h-16 border-b bg-background/95" />
    }>
      <MobileHeaderInner user={user} />
    </Suspense>
  )
}
