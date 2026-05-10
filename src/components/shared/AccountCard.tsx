import { TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import type { AccountWithType } from '@/lib/supabase/queries/accounts'
import { cn } from '@/lib/utils'

function formatCurrency(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

interface Props {
  account: AccountWithType
  locale: string
  trend?: 'up' | 'down' | 'flat'
}

export function AccountCard({ account, locale, trend = 'flat' }: Props) {
  const isLiability = account.account_type?.nature === 'liability'

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm">
      {/* Color dot / icon */}
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-base"
        style={{ background: account.color ?? 'hsl(var(--muted))' }}
      >
        {account.icon ?? account.account_type?.icon ?? '🏦'}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{account.name}</p>
        <p className="text-xs text-muted-foreground">{account.account_type?.name ?? '—'}</p>
      </div>

      <div className="text-right shrink-0">
        <p
          className={cn(
            'text-sm font-semibold tabular-nums',
            isLiability ? 'text-red-500 dark:text-red-400' : 'text-foreground',
          )}
        >
          {formatCurrency(account.current_balance, account.currency_code, locale)}
        </p>
        {trend !== 'flat' && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-[10px] font-medium',
              trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
            )}
          >
            {trend === 'up' ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
          </span>
        )}
      </div>
    </div>
  )
}

export function AccountsSection({ accounts, locale }: { accounts: AccountWithType[]; locale: string }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Cuentas</h2>
        <Link href="/settings" className="text-xs text-primary hover:underline">
          Ver todas
        </Link>
      </div>
      <div className="space-y-2">
        {accounts.slice(0, 5).map((acc) => (
          <AccountCard key={acc.id} account={acc} locale={locale} />
        ))}
        {accounts.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No hay cuentas activas.</p>
        )}
      </div>
    </div>
  )
}

export function AccountsSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm animate-pulse">
      <div className="mb-3 h-4 w-24 rounded bg-muted" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  )
}
