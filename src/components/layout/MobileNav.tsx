'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, ArrowLeftRight, PieChart, Plus, Menu } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui.store'
import { MobileMoreSheet } from './MobileMoreSheet'

const NAV_ITEMS = [
  { href: '/',             label: 'Inicio',  icon: Home },
  { href: '/transactions', label: 'Movim.',  icon: ArrowLeftRight },
  // center = FAB
  { href: '/budgets',      label: 'Pres.',   icon: PieChart },
] as const

interface Props {
  user: User | null
}

export function MobileNav({ user }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const { setQuickAddOpen, setMoreSheetOpen } = useUIStore()

  function handleFAB() {
    setQuickAddOpen(true)
    router.push('/transactions?new=1')
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      <MobileMoreSheet user={user} />

      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t pb-2.5"
        style={{ background: 'oklch(1 0 0 / 0.92)', backdropFilter: 'blur(12px)' }}
      >
        <div
          className="grid items-center"
          style={{ gridTemplateColumns: '1fr 1fr 64px 1fr 1fr' }}
        >
          {/* Left items */}
          {NAV_ITEMS.slice(0, 2).map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 pt-2.5 pb-1',
                  'text-[10.5px] font-medium transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {active && (
                  <span className="absolute top-0 h-[3px] w-7 rounded-full bg-accent" />
                )}
                <Icon className="size-5" strokeWidth={1.75} />
                <span>{label}</span>
              </Link>
            )
          })}

          {/* FAB — central */}
          <div className="relative flex justify-center">
            <button
              onClick={handleFAB}
              className="absolute flex items-center justify-center rounded-full bg-foreground text-background"
              style={{
                width: 52, height: 52,
                top: -22,
                border: '4px solid white',
                boxShadow: '0 4px 16px oklch(0.145 0 0 / 0.24)',
              }}
              aria-label="Nueva transacción"
            >
              <Plus className="size-6" strokeWidth={2} />
            </button>
          </div>

          {/* Right item */}
          {NAV_ITEMS.slice(2).map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 pt-2.5 pb-1',
                  'text-[10.5px] font-medium transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {active && (
                  <span className="absolute top-0 h-[3px] w-7 rounded-full bg-accent" />
                )}
                <Icon className="size-5" strokeWidth={1.75} />
                <span>{label}</span>
              </Link>
            )
          })}

          {/* Más button */}
          <button
            onClick={() => setMoreSheetOpen(true)}
            className="relative flex flex-col items-center gap-0.5 pt-2.5 pb-1 text-[10.5px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="size-5" strokeWidth={1.75} />
            <span>Más</span>
          </button>
        </div>
      </nav>
    </>
  )
}
