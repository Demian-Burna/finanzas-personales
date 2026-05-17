import { cn } from '@/lib/utils'
import type { TransactionWithRelations } from '@/lib/supabase/queries/transactions'

interface Props {
  tx: TransactionWithRelations
  currency: string
  locale: string
  className?: string
}

function formatCurrency(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(isoDate: string, locale: string) {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
  })
}

export function TxRow({ tx, currency, locale, className }: Props) {
  const isExpense = tx.transaction_type === 'expense'
  const isTransfer = tx.transaction_type === 'transfer'
  const txCurrency = tx.currency_code ?? currency
  const meta = [tx.category?.name, tx.account?.name].filter(Boolean).join(' · ')

  return (
    <div className={cn('flex items-center gap-3 py-2.5', className)}>
      {/* Avatar with category emoji */}
      <div
        className="flex size-[34px] shrink-0 items-center justify-center rounded-full text-base"
        style={{
          background: tx.category?.color
            ? `${tx.category.color}20`
            : 'oklch(0.96 0 0)',
        }}
      >
        {tx.category?.icon ? (
          <span className="leading-none">{tx.category.icon}</span>
        ) : (
          <span className="text-xs font-bold text-muted-foreground">
            {(tx.description ?? '?')[0]?.toUpperCase()}
          </span>
        )}
      </div>

      {/* Description + meta */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight text-foreground">
          {tx.description ?? '—'}
        </p>
        {meta && (
          <p className="truncate text-xs-plus text-muted-foreground leading-tight mt-0.5">
            {meta}
          </p>
        )}
      </div>

      {/* Amount + date */}
      <div className="flex flex-col items-end shrink-0 gap-0.5">
        <span
          className={cn(
            'text-sm font-semibold tabular-nums leading-tight',
            isTransfer
              ? 'text-foreground'
              : isExpense
                ? 'text-red-500 dark:text-red-400'
                : 'text-emerald-600 dark:text-emerald-400',
          )}
        >
          {isExpense ? '−' : isTransfer ? '' : '+'}
          {formatCurrency(Math.abs(tx.amount), txCurrency, locale)}
        </span>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {formatDate(tx.transaction_date, locale)}
        </span>
      </div>
    </div>
  )
}
