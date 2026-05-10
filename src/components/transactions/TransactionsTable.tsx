'use client'

import { useRef, useState, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { MoreHorizontal, Edit, Copy, Trash2, CheckSquare, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { TransactionWithRelations } from '@/lib/supabase/queries/transactions'
import type { AccountWithType } from '@/lib/supabase/queries/accounts'
import type { CategoryWithParent } from '@/lib/supabase/queries/categories'
import type { TransactionFormValues } from '@/lib/validations/transaction'
import { TransactionForm } from '@/components/forms/TransactionForm'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  useUpdateTransaction,
  useDeleteTransaction,
  useDuplicateTransaction,
  useBulkDeleteTransactions,
} from '@/hooks/useTransactionMutations'

interface Props {
  transactions: TransactionWithRelations[]
  accounts: AccountWithType[]
  categories: CategoryWithParent[]
  currency: string
  locale: string
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onLoadMore?: () => void
}

function formatCurrency(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

export function TransactionsTable({
  transactions,
  accounts,
  categories,
  currency,
  locale,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: Props) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editTx, setEditTx] = useState<TransactionWithRelations | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const updateMutation = useUpdateTransaction()
  const deleteMutation = useDeleteTransaction()
  const duplicateMutation = useDuplicateTransaction()
  const bulkDeleteMutation = useBulkDeleteTransactions()

  const virtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 10,
  })

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelected((prev) =>
      prev.size === transactions.length
        ? new Set()
        : new Set(transactions.map((t) => t.id)),
    )
  }, [transactions])

  function handleEdit(values: TransactionFormValues) {
    if (!editTx) return
    updateMutation.mutate(
      { id: editTx.id, values },
      { onSuccess: (r) => { if (r.ok) setEditTx(null) } },
    )
  }

  function handleBulkDelete() {
    bulkDeleteMutation.mutate(Array.from(selected), {
      onSuccess: (r) => { if (r.ok) setSelected(new Set()) },
    })
  }

  const items = virtualizer.getVirtualItems()

  return (
    <>
      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/60 px-4 py-2 text-sm">
          <CheckSquare className="size-4 text-primary" />
          <span className="font-medium">{selected.size} seleccionada{selected.size !== 1 ? 's' : ''}</span>
          <Button
            variant="destructive"
            size="sm"
            className="ml-auto h-7 text-xs"
            onClick={handleBulkDelete}
            disabled={bulkDeleteMutation.isPending}
          >
            Eliminar
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelected(new Set())}>
            Cancelar
          </Button>
        </div>
      )}

      {/* Table container */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 grid grid-cols-[1.5rem_1fr_auto_2rem] sm:grid-cols-[2rem_1fr_minmax(120px,1fr)_minmax(100px,1fr)_minmax(80px,auto)_2.5rem] gap-x-3 border-b bg-card/95 backdrop-blur px-3 sm:px-4 py-2.5 text-xs font-medium text-muted-foreground">
          <input
            type="checkbox"
            className="rounded"
            checked={selected.size === transactions.length && transactions.length > 0}
            onChange={toggleAll}
            title="Seleccionar todas"
          />
          <span>Descripción</span>
          <span className="hidden sm:block">Categoría</span>
          <span className="hidden sm:block">Cuenta</span>
          <span className="text-right">Monto</span>
          <span />
        </div>

        {transactions.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No hay transacciones que coincidan con los filtros.
          </div>
        ) : (
          <div
            ref={parentRef}
            className="overflow-y-auto"
            style={{ height: 'calc(100svh - 280px)', minHeight: 240 }}
          >
            <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
              {items.map((vRow) => {
                const tx = transactions[vRow.index]
                if (!tx) return null
                const isExpense = tx.transaction_type === 'expense'
                const isSelected = selected.has(tx.id)
                const txCurrency = tx.currency_code ?? currency

                return (
                  <div
                    key={tx.id}
                    data-index={vRow.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: vRow.start,
                      left: 0,
                      width: '100%',
                    }}
                    className={cn(
                      'grid grid-cols-[1.5rem_1fr_auto_2rem] sm:grid-cols-[2rem_1fr_minmax(120px,1fr)_minmax(100px,1fr)_minmax(80px,auto)_2.5rem]',
                      'gap-x-3 items-center border-b px-3 sm:px-4 py-2 text-sm transition-colors last:border-0',
                      isSelected ? 'bg-primary/5' : 'hover:bg-muted/40',
                    )}
                  >
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={isSelected}
                      onChange={() => toggleSelect(tx.id)}
                    />

                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{tx.description ?? '—'}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        {/* Show category inline on mobile only */}
                        {tx.category?.icon && <span className="sm:hidden">{tx.category.icon}</span>}
                        {format(new Date(tx.transaction_date + 'T00:00:00'), 'd MMM yyyy', { locale: es })}
                        {tx.account?.name && <span className="sm:hidden">· {tx.account.name}</span>}
                      </p>
                    </div>

                    <div className="hidden sm:block min-w-0">
                      {tx.category ? (
                        <span
                          className="inline-flex items-center gap-1 truncate text-xs"
                          style={{ color: tx.category.color ?? undefined }}
                        >
                          {tx.category.icon && <span>{tx.category.icon}</span>}
                          {tx.category.name}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {tx.transaction_type === 'transfer' ? 'Transferencia' : '—'}
                        </span>
                      )}
                    </div>

                    <span className="hidden sm:block truncate text-xs text-muted-foreground">
                      {tx.account?.name ?? '—'}
                    </span>

                    <span
                      className={cn(
                        'text-right text-sm font-semibold tabular-nums',
                        isExpense
                          ? 'text-red-500 dark:text-red-400'
                          : 'text-emerald-600 dark:text-emerald-400',
                      )}
                    >
                      {isExpense ? '-' : '+'}
                      {formatCurrency(Math.abs(tx.amount), txCurrency, locale)}
                    </span>

                    {/* Row actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors focus:outline-none"
                        aria-label="Acciones"
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={() => setEditTx(tx)}
                          className="flex items-center gap-2"
                        >
                          <Edit className="size-3.5" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => duplicateMutation.mutate(tx.id)}
                          className="flex items-center gap-2"
                        >
                          <Copy className="size-3.5" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {deleteConfirm === tx.id ? (
                          <DropdownMenuItem
                            onClick={() => {
                              deleteMutation.mutate(tx.id)
                              setDeleteConfirm(null)
                            }}
                            variant="destructive"
                            className="flex items-center gap-2"
                          >
                            <Trash2 className="size-3.5" />
                            Confirmar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => setDeleteConfirm(tx.id)}
                            variant="destructive"
                            className="flex items-center gap-2"
                          >
                            <Trash2 className="size-3.5" />
                            Eliminar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Load more */}
        {hasNextPage && (
          <div className="flex justify-center border-t p-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLoadMore}
              disabled={isFetchingNextPage}
              className="text-xs"
            >
              {isFetchingNextPage && <Loader2 className="mr-2 size-3.5 animate-spin" />}
              Cargar más
            </Button>
          </div>
        )}
      </div>

      {/* Edit dialog */}
      <TransactionForm
        open={!!editTx}
        onOpenChange={(open) => { if (!open) setEditTx(null) }}
        accounts={accounts}
        categories={categories}
        transaction={editTx ?? undefined}
        onSubmit={handleEdit}
        isPending={updateMutation.isPending}
      />
    </>
  )
}
