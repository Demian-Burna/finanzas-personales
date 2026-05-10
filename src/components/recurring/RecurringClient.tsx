'use client'

import { useState, useTransition } from 'react'
import { Plus, Edit, Power, PowerOff, Trash2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { format, differenceInDays, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { RecurringItemWithRelations } from '@/lib/supabase/queries/recurring-items'
import type { AccountWithType } from '@/lib/supabase/queries/accounts'
import type { CategoryWithParent } from '@/lib/supabase/queries/categories'
import type { RecurringItemInput } from '@/lib/validations/recurring-item'
import { RecurringItemForm } from '@/components/forms/RecurringItemForm'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  createRecurringItemAction,
  updateRecurringItemAction,
  toggleRecurringItemAction,
  deleteRecurringItemAction,
} from '@/app/(dashboard)/recurring/actions'

interface Props {
  items: RecurringItemWithRelations[]
  accounts: AccountWithType[]
  categories: CategoryWithParent[]
  currency: string
  locale: string
}

const FREQ_LABEL: Record<string, string> = {
  daily: 'Diario', weekly: 'Semanal', biweekly: 'Quincenal',
  monthly: 'Mensual', bimonthly: 'Bimestral', quarterly: 'Trimestral', yearly: 'Anual',
}

const FREQ_ORDER: Record<string, number> = {
  daily: 0, weekly: 1, biweekly: 2, monthly: 3, bimonthly: 4, quarterly: 5, yearly: 6,
}

function urgencyBadge(nextDate: string | null): { label: string; className: string } | null {
  if (!nextDate) return null
  const days = differenceInDays(parseISO(nextDate), new Date())
  if (days <= 0)  return { label: 'Hoy', className: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' }
  if (days <= 7)  return { label: 'Esta semana', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' }
  if (days <= 31) return { label: 'Próximo mes', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' }
  return null
}

function formatCurrency(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}

export function RecurringClient({ items, accounts, categories, currency, locale }: Props) {
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<RecurringItemWithRelations | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Group by frequency
  const grouped = items.reduce<Record<string, RecurringItemWithRelations[]>>((acc, item) => {
    const key = item.frequency
    if (!acc[key]) acc[key] = []
    acc[key]!.push(item)
    return acc
  }, {})

  const sortedGroups = Object.entries(grouped).sort(
    ([a], [b]) => (FREQ_ORDER[a] ?? 99) - (FREQ_ORDER[b] ?? 99),
  )

  function handleCreate(values: RecurringItemInput) {
    startTransition(async () => {
      const res = await createRecurringItemAction(values)
      if (!res.ok) { toast.error(res.error); return }
      toast.success('Recurrente creado')
      setFormOpen(false)
    })
  }

  function handleUpdate(values: RecurringItemInput) {
    if (!editItem) return
    startTransition(async () => {
      const res = await updateRecurringItemAction(editItem.id, values)
      if (!res.ok) { toast.error(res.error); return }
      toast.success('Recurrente actualizado')
      setEditItem(null)
    })
  }

  function handleToggle(id: string, isActive: boolean) {
    startTransition(async () => {
      const res = await toggleRecurringItemAction(id, isActive)
      if (!res.ok) toast.error(res.error)
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteRecurringItemAction(id)
      if (!res.ok) { toast.error(res.error); return }
      toast.success('Eliminado')
      setDeleteConfirm(null)
    })
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
        <Clock className="size-10 mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">Todavía no tenés gastos recurrentes.</p>
        <Button onClick={() => setFormOpen(true)} size="sm" className="mt-4 gap-1.5">
          <Plus className="size-4" /> Agregar el primero
        </Button>
        <RecurringItemForm open={formOpen} onOpenChange={setFormOpen} accounts={accounts} categories={categories} defaultCurrency={currency} onSubmit={handleCreate} isPending={isPending} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {sortedGroups.map(([freq, freqItems]) => (
        <section key={freq}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {FREQ_LABEL[freq] ?? freq}
          </h2>
          <div className="space-y-2">
            {freqItems.map((item) => {
              const badge = urgencyBadge(item.next_occurrence_date)
              const isExpense = item.transaction_type === 'expense'
              return (
                <div key={item.id} className={cn(
                  'flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm transition-opacity',
                  !item.is_active && 'opacity-50',
                )}>
                  {/* Category icon / color dot */}
                  <span className="size-9 shrink-0 flex items-center justify-center rounded-full bg-muted text-base">
                    {item.category?.icon ?? (isExpense ? '💸' : '💰')}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{item.description}</p>
                      {badge && (
                        <span className={cn('text-[10px] font-medium rounded-full px-2 py-0.5', badge.className)}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.account?.name ?? '—'}
                      {item.next_occurrence_date && ` · Próxima: ${format(parseISO(item.next_occurrence_date), 'd MMM', { locale: es })}`}
                    </p>
                  </div>

                  <span className={cn('text-sm font-semibold tabular-nums shrink-0',
                    isExpense ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400',
                  )}>
                    {isExpense ? '-' : '+'}{formatCurrency(item.amount, item.currency_code ?? currency, locale)}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setEditItem(item)} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors" title="Editar">
                      <Edit className="size-3.5" />
                    </button>
                    <button onClick={() => handleToggle(item.id, !item.is_active)} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors" title={item.is_active ? 'Desactivar' : 'Activar'}>
                      {item.is_active ? <PowerOff className="size-3.5" /> : <Power className="size-3.5" />}
                    </button>
                    {deleteConfirm === item.id ? (
                      <button onClick={() => handleDelete(item.id)} className="flex size-7 items-center justify-center rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors" title="Confirmar">
                        <Trash2 className="size-3.5" />
                      </button>
                    ) : (
                      <button onClick={() => setDeleteConfirm(item.id)} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors" title="Eliminar">
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}

      {/* FAB */}
      <button onClick={() => setFormOpen(true)} className="fixed bottom-20 right-4 z-40 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg lg:hidden" aria-label="Nuevo recurrente">
        <Plus className="size-5" />
      </button>

      <RecurringItemForm open={formOpen} onOpenChange={setFormOpen} accounts={accounts} categories={categories} defaultCurrency={currency} onSubmit={handleCreate} isPending={isPending} />
      <RecurringItemForm open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null) }} accounts={accounts} categories={categories} defaultCurrency={currency} item={editItem ?? undefined} onSubmit={handleUpdate} isPending={isPending} />
    </div>
  )
}
