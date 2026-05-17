import Link from 'next/link'
import type { TransactionWithRelations } from '@/lib/supabase/queries/transactions'
import { TxRow } from '@/components/shared/TxRow'
import { cn } from '@/lib/utils'

interface Props {
  transactions: TransactionWithRelations[]
  currency: string
  locale: string
}

function formatDate(isoDate: string, locale: string) {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
  })
}

function formatCurrency(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function RecentTransactionsSection({ transactions, currency, locale }: Props) {
  return (
    <div className="rounded-xl border bg-card p-5" style={{ boxShadow: 'var(--card-edge)' }}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Transacciones recientes</h2>
        <Link href="/transactions" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Ver todas
        </Link>
      </div>

      {transactions.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No hay transacciones.</p>
      ) : (
        <>
          {/* Mobile: TxRow stack */}
          <div className="lg:hidden divide-y divide-border -mx-1 px-1">
            {transactions.map((tx) => (
              <TxRow key={tx.id} tx={tx} currency={currency} locale={locale} />
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden lg:block overflow-x-auto -mx-1">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-2 text-left font-medium pl-1">Fecha</th>
                  <th className="pb-2 text-left font-medium">Descripción</th>
                  <th className="pb-2 text-left font-medium hidden sm:table-cell">Categoría</th>
                  <th className="pb-2 text-left font-medium hidden md:table-cell">Cuenta</th>
                  <th className="pb-2 text-right font-medium pr-1">Monto</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isExpense = tx.transaction_type === 'expense'
                  const txCurrency = tx.currency_code ?? currency
                  return (
                    <tr
                      key={tx.id}
                      className="border-b last:border-0 hover:bg-muted/40 transition-colors"
                    >
                      <td className="py-2 pl-1 text-muted-foreground whitespace-nowrap">
                        {formatDate(tx.transaction_date, locale)}
                      </td>
                      <td className="py-2 max-w-[140px]">
                        <span className="truncate block text-foreground">
                          {tx.description ?? '—'}
                        </span>
                      </td>
                      <td className="py-2 hidden sm:table-cell">
                        {tx.category ? (
                          <span className="inline-flex items-center gap-1">
                            {tx.category.icon && <span>{tx.category.icon}</span>}
                            <span
                              className="truncate max-w-[100px]"
                              style={{ color: tx.category.color ?? undefined }}
                            >
                              {tx.category.name}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2 hidden md:table-cell text-muted-foreground truncate max-w-[100px]">
                        {tx.account?.name ?? '—'}
                      </td>
                      <td
                        className={cn(
                          'py-2 pr-1 text-right tabular-nums font-medium whitespace-nowrap',
                          isExpense
                            ? 'text-red-500 dark:text-red-400'
                            : 'text-emerald-600 dark:text-emerald-400',
                        )}
                      >
                        {isExpense ? '-' : '+'}
                        {formatCurrency(Math.abs(tx.amount), txCurrency, locale)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

export function RecentTransactionsSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 animate-pulse" style={{ boxShadow: 'var(--card-edge)' }}>
      <div className="mb-3 h-4 w-44 rounded bg-muted" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 rounded bg-muted" />
        ))}
      </div>
    </div>
  )
}
