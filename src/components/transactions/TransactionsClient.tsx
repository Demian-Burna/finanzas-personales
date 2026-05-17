'use client'

import { useState, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Plus, Search, SlidersHorizontal } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { useCreateTransaction } from '@/hooks/useTransactionMutations'
import { TransactionFilters } from '@/components/transactions/TransactionFilters'
import { TransactionsTable } from '@/components/transactions/TransactionsTable'
import { TransactionForm } from '@/components/forms/TransactionForm'
import { SearchOverlay } from '@/components/transactions/SearchOverlay'
import { MobilePageHeader } from '@/components/layout/MobilePageHeader'
import { TxRow } from '@/components/shared/TxRow'
import { EmptyCard } from '@/components/shared/EmptyCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AccountWithType } from '@/lib/supabase/queries/accounts'
import type { CategoryWithParent } from '@/lib/supabase/queries/categories'
import type { TransactionFormValues } from '@/lib/validations/transaction'
import type { TransactionWithRelations } from '@/lib/supabase/queries/transactions'

interface Props {
  accounts: AccountWithType[]
  categories: CategoryWithParent[]
  currency: string
  locale: string
}

function fmt(v: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
}

const TYPE_FILTERS = [
  { value: undefined,    label: 'Todas' },
  { value: 'income',     label: 'Ingresos' },
  { value: 'expense',    label: 'Gastos' },
  { value: 'transfer',   label: 'Transferencias' },
] as const

// Group transactions by date for mobile
function groupByDate(txs: TransactionWithRelations[], locale: string) {
  const groups: { label: string; items: TransactionWithRelations[] }[] = []
  const map = new Map<string, TransactionWithRelations[]>()

  for (const tx of txs) {
    const key = tx.transaction_date
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(tx)
  }

  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  const fmt = (d: Date) => d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()

  for (const [date, items] of Array.from(map.entries())) {
    const d = new Date(date + 'T00:00:00')
    const isToday = d.toDateString() === today.toDateString()
    const isYesterday = d.toDateString() === yesterday.toDateString()
    const label = isToday ? `HOY · ${d.getDate()} ${d.toLocaleDateString(locale, { month: 'short' }).toUpperCase()}`
      : isYesterday ? `AYER · ${d.getDate()} ${d.toLocaleDateString(locale, { month: 'short' }).toUpperCase()}`
      : fmt(d)
    groups.push({ label, items })
  }

  return groups
}

export function TransactionsClient({ accounts, categories, currency, locale }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [createOpen, setCreateOpen] = useState(() => params.get('new') === '1')
  const [searchOpen, setSearchOpen] = useState(false)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const createMutation = useCreateTransaction()

  const activeType = params.get('type') ?? undefined
  const filters = {
    type: (activeType as 'income' | 'expense' | 'transfer' | undefined),
    accountId: params.get('account') ?? undefined,
    categoryId: params.get('category') ?? undefined,
    search: params.get('q') ?? undefined,
    dateFrom: params.get('from') ?? undefined,
    dateTo: params.get('to') ?? undefined,
  }

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = useTransactions(filters)
  const transactions = data?.pages.flat() ?? []

  const handleCreate = useCallback(
    (values: TransactionFormValues) => {
      createMutation.mutate(values, {
        onSuccess: (r) => { if (r.ok) setCreateOpen(false) },
      })
    },
    [createMutation],
  )

  function setType(type: string | undefined) {
    const next = new URLSearchParams(params.toString())
    if (type) next.set('type', type)
    else next.delete('type')
    next.delete('cursor')
    router.replace(`${pathname}?${next.toString()}`)
  }

  // Summary for mobile header cards
  const totalIncome = transactions.filter(t => t.transaction_type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpenses = transactions.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + t.amount, 0)

  const groups = groupByDate(transactions, locale)

  return (
    <div>
      {/* Mobile full-screen search */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} currency={currency} locale={locale} />

      {/* Mobile page header */}
      <MobilePageHeader
        title="Transacciones"
        action={
          <div className="flex items-center gap-1">
            <button onClick={() => setSearchOpen(true)} className="flex size-9 items-center justify-center text-foreground" aria-label="Buscar">
              <Search className="size-[18px]" strokeWidth={1.75} />
            </button>
            <button onClick={() => setFilterSheetOpen(true)} className="flex size-9 items-center justify-center text-foreground" aria-label="Filtrar">
              <SlidersHorizontal className="size-[18px]" strokeWidth={1.75} />
            </button>
          </div>
        }
      />

      {/* ── Mobile layout ── */}
      <div className="lg:hidden">
        {/* Type filter chips */}
        <div className="flex gap-2 overflow-x-auto px-4 py-3 [&::-webkit-scrollbar]:hidden">
          {TYPE_FILTERS.map(({ value, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => setType(value)}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors',
                activeType === value
                  ? 'bg-foreground text-background'
                  : 'border border-border bg-card text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Summary cards — income / expenses */}
        {(totalIncome > 0 || totalExpenses > 0) && !filters.search && !activeType && (
          <div className="grid grid-cols-2 gap-3 px-4 pb-3">
            <div className="rounded-xl p-3" style={{ background: 'var(--success-soft)' }}>
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--success)' }}>Ingresos</p>
              <p className="mt-1 text-base font-bold tabular-nums" style={{ color: 'var(--success)' }}>{fmt(totalIncome, currency, locale)}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'var(--danger-soft)' }}>
              <p className="text-[9px] font-bold uppercase tracking-widest text-red-600 dark:text-red-400">Gastos</p>
              <p className="mt-1 text-base font-bold tabular-nums text-red-600 dark:text-red-400">{fmt(totalExpenses, currency, locale)}</p>
            </div>
          </div>
        )}

        {/* Date-grouped transaction list */}
        {transactions.length === 0 ? (
          <div className="px-4 pt-4">
            <EmptyCard emoji="🔍" title="Sin resultados" description="No hay transacciones con los filtros activos." className="border-dashed" />
          </div>
        ) : (
          <div className="pb-4">
            {groups.map(({ label, items }) => (
              <div key={label}>
                <div className="px-4 py-2 text-[10px] font-semibold text-muted-foreground" style={{ letterSpacing: '0.04em' }}>
                  {label}
                </div>
                <div className="mx-4 rounded-xl border bg-card overflow-hidden divide-y divide-border">
                  {items.map((tx) => (
                    <div key={tx.id} className="px-3">
                      <TxRow tx={tx} currency={currency} locale={locale} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {hasNextPage && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => void fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="rounded-full border px-4 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors"
                >
                  {isFetchingNextPage ? 'Cargando...' : 'Cargar más'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Filter sheet for mobile */}
        <TransactionFilters
          accounts={accounts}
          categories={categories}
          externalSheetOpen={filterSheetOpen}
          onExternalSheetClose={() => setFilterSheetOpen(false)}
        />
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden lg:block space-y-4">
        <div className="flex items-start gap-3">
          <TransactionFilters accounts={accounts} categories={categories} />
          <Button onClick={() => setCreateOpen(true)} size="sm" className="shrink-0 gap-1.5 h-9">
            <Plus className="size-4" />
            Nueva
          </Button>
        </div>
        <TransactionsTable
          transactions={transactions}
          accounts={accounts}
          categories={categories}
          currency={currency}
          locale={locale}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={() => void fetchNextPage()}
        />
      </div>

      <TransactionForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        accounts={accounts}
        categories={categories}
        defaultCurrency={currency}
        onSubmit={handleCreate}
        isPending={createMutation.isPending}
      />
    </div>
  )
}
