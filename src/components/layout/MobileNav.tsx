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
  // center slot = FAB
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
    // Open global quick-add sheet. Until Step 5 lands, fall back to ?new=1.
    setQuickAddOpen(true)
    router.push('/transactions?new=1')
  }

  return (
    <>
      <MobileMoreSheet user={user} />

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 backdrop-blur-sm safe-bottom">
        <div className="flex items-end h-16 px-2">

          {/* Left items */}
          {NAV_ITEMS.slice(0, 2).map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-1 flex-col items-center gap-0.5 pb-3 pt-2 text-[10px] font-medium transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-[22px]" strokeWidth={1.75} />
                <span>{label}</span>
                {active && <span className="absolute bottom-1.5 h-0.5 w-5 rounded-full bg-foreground" />}
              </Link>
            )
          })}

          {/* FAB — central */}
          <div className="flex flex-1 flex-col items-center pb-3">
            <button
              onClick={handleFAB}
              className="flex size-12 -translate-y-3 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 active:scale-95 transition-all"
              aria-label="Nueva transacción"
            >
              <Plus className="size-6" strokeWidth={2} />
            </button>
          </div>

          {/* Right items + Más */}
          {NAV_ITEMS.slice(2).map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-1 flex-col items-center gap-0.5 pb-3 pt-2 text-[10px] font-medium transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-[22px]" strokeWidth={1.75} />
                <span>{label}</span>
                {active && <span className="absolute bottom-1.5 h-0.5 w-5 rounded-full bg-foreground" />}
              </Link>
            )
          })}

          <button
            onClick={() => setMoreSheetOpen(true)}
            className="flex flex-1 flex-col items-center gap-0.5 pb-3 pt-2 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="size-[22px]" strokeWidth={1.75} />
            <span>Más</span>
          </button>

        </div>
      </nav>
    </>
  )
}
