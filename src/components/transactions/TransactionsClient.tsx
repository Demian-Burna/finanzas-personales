'use client'

import { useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { useCreateTransaction } from '@/hooks/useTransactionMutations'
import { TransactionFilters } from '@/components/transactions/TransactionFilters'
import { TransactionsTable } from '@/components/transactions/TransactionsTable'
import { TransactionForm } from '@/components/forms/TransactionForm'
import { SearchOverlay } from '@/components/transactions/SearchOverlay'
import { Button } from '@/components/ui/button'
import type { AccountWithType } from '@/lib/supabase/queries/accounts'
import type { CategoryWithParent } from '@/lib/supabase/queries/categories'
import type { TransactionFormValues } from '@/lib/validations/transaction'

interface Props {
  accounts: AccountWithType[]
  categories: CategoryWithParent[]
  currency: string
  locale: string
}

export function TransactionsClient({ accounts, categories, currency, locale }: Props) {
  const params = useSearchParams()
  // Auto-open create form when navigated from the dashboard FAB (?new=1)
  const [createOpen, setCreateOpen] = useState(() => params.get('new') === '1')
  const [searchOpen, setSearchOpen] = useState(false)
  const createMutation = useCreateTransaction()

  const filters = {
    type: (params.get('type') as 'income' | 'expense' | 'transfer' | undefined) ?? undefined,
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

  return (
    <div className="space-y-4">
      {/* Search overlay — mobile full-screen */}
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        currency={currency}
        locale={locale}
      />

      {/* Toolbar */}
      <div className="flex items-start gap-2">
        {/* Mobile: search icon button */}
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden size-8 shrink-0 rounded-full mt-0.5"
          onClick={() => setSearchOpen(true)}
          aria-label="Buscar"
        >
          <Search className="size-3.5" />
        </Button>

        <TransactionFilters accounts={accounts} categories={categories} />

        <Button
          onClick={() => setCreateOpen(true)}
          size="sm"
          className="hidden sm:inline-flex shrink-0 gap-1.5 h-9 mt-0"
        >
          <Plus className="size-4" />
          Nueva
        </Button>
      </div>

      {/* Table */}
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

      {/* Create dialog */}
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
