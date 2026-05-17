'use client'

import { useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { useCreateTransaction } from '@/hooks/useTransactionMutations'
import { TransactionFilters } from '@/components/transactions/TransactionFilters'
import { TransactionsTable } from '@/components/transactions/TransactionsTable'
import { TransactionForm } from '@/components/forms/TransactionForm'
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
      {/* Toolbar: filters take full width, Nueva button anchored top-right on desktop */}
      <div className="flex items-start gap-3">
        <TransactionFilters accounts={accounts} categories={categories} />
        {/* Hidden on mobile — FAB handles it */}
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
