'use client'

import { Suspense } from 'react'
import { Bell } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { usePathname } from 'next/navigation'
import { useUIStore } from '@/stores/ui.store'
import { PeriodSelector } from './PeriodSelector'

interface Props {
  user: User | null
}

const avatarLetter = (user: User | null) => {
  const name = (user?.user_metadata?.['full_name'] as string | undefined) ?? user?.email ?? '?'
  return name[0]?.toUpperCase() ?? '?'
}

// Period selector shown on dashboard, transactions, and budgets
const PERIOD_ROUTES = ['/', '/transactions', '/budgets']

function MobileHeaderInner({ user }: Props) {
  const pathname = usePathname()
  const { setMoreSheetOpen, setNotificationsOpen } = useUIStore()

  // Only show on dashboard — sub-pages have their own MobilePageHeader
  if (pathname !== '/') return null

  const avatarUrl = user?.user_metadata?.['avatar_url'] as string | undefined
  const displayName = (user?.user_metadata?.['full_name'] as string | undefined) ?? user?.email ?? ''

  const showPeriod = PERIOD_ROUTES.some((r) =>
    r === '/' ? pathname === '/' : pathname.startsWith(r),
  )

  return (
    <header className="lg:hidden sticky top-0 z-40 flex h-16 items-center justify-between border-b px-4"
      style={{ background: 'var(--background)' }}>
      {/* Avatar → opens MoreSheet */}
      <button
        onClick={() => setMoreSheetOpen(true)}
        className="flex size-[30px] shrink-0 items-center justify-center rounded-full focus:outline-none"
        style={{ background: 'var(--accent)' }}
        aria-label="Abrir menú"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={displayName} className="size-[30px] rounded-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="text-xs font-semibold text-white">
            {avatarLetter(user)}
          </span>
        )}
      </button>

      {/* Center — PeriodSelector */}
      <div className="flex flex-1 items-center justify-center">
        {showPeriod ? (
          <PeriodSelector />
        ) : (
          <span className="text-sm font-semibold">Finanzas</span>
        )}
      </div>

      {/* Bell */}
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
    <Suspense fallback={null}>
      <MobileHeaderInner user={user} />
    </Suspense>
  )
}
