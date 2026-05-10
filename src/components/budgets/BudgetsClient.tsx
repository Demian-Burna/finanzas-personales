'use client'

import { useState, useTransition } from 'react'
import { Plus, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import type { BudgetWithProgress } from '@/lib/supabase/queries/budgets'
import type { CategoryWithParent } from '@/lib/supabase/queries/categories'
import type { BudgetInput } from '@/lib/validations/budget'
import { BudgetCard, BudgetCardSkeleton } from '@/components/shared/BudgetCard'
import { BudgetForm } from '@/components/forms/BudgetForm'
import { Button } from '@/components/ui/button'
import {
  createBudgetAction,
  updateBudgetAction,
  toggleBudgetActiveAction,
  deleteBudgetAction,
} from '@/app/(dashboard)/budgets/actions'

interface Props {
  budgets: BudgetWithProgress[]
  categories: CategoryWithParent[]
  currency: string
  locale: string
}

export function BudgetsClient({ budgets, categories, currency, locale }: Props) {
  const [formOpen, setFormOpen] = useState(false)
  const [editBudget, setEditBudget] = useState<BudgetWithProgress | null>(null)
  const [isPending, startTransition] = useTransition()

  const alertBudgets = budgets.filter(
    (b) => b.is_active && b.amount > 0 && (b.spent_amount / b.amount) * 100 >= b.alert_threshold_pct,
  )

  const totalBudgeted = budgets
    .filter((b) => b.is_active)
    .reduce((sum, b) => sum + b.amount, 0)

  const totalSpent = budgets
    .filter((b) => b.is_active)
    .reduce((sum, b) => sum + b.spent_amount, 0)

  const globalPct = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0

  function handleCreate(values: BudgetInput) {
    startTransition(async () => {
      const res = await createBudgetAction(values)
      if (!res.ok) { toast.error(res.error); return }
      toast.success('Presupuesto creado')
      setFormOpen(false)
    })
  }

  function handleUpdate(values: BudgetInput) {
    if (!editBudget) return
    startTransition(async () => {
      const res = await updateBudgetAction(editBudget.id, values)
      if (!res.ok) { toast.error(res.error); return }
      toast.success('Presupuesto actualizado')
      setEditBudget(null)
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteBudgetAction(id)
      if (!res.ok) { toast.error(res.error); return }
      toast.success('Presupuesto eliminado')
    })
  }

  function handleToggleActive(id: string, isActive: boolean) {
    startTransition(async () => {
      const res = await toggleBudgetActiveAction(id, isActive)
      if (!res.ok) { toast.error(res.error); return }
      toast.success(isActive ? 'Presupuesto activado' : 'Presupuesto desactivado')
    })
  }

  // Sort by pct executed desc (most critical first)
  const sorted = [...budgets].sort((a, b) => {
    const pA = a.amount > 0 ? b.spent_amount / b.amount : 0
    const pB = b.amount > 0 ? b.spent_amount / b.amount : 0
    return pB - pA
  })

  return (
    <div className="space-y-5">
      {/* Header action — always visible, not just on empty state */}
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setFormOpen(true)} className="gap-1.5 hidden sm:inline-flex">
          <Plus className="size-4" />
          Nuevo presupuesto
        </Button>
      </div>

      {/* Alert banner */}
      {alertBudgets.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">
              {alertBudgets.length} presupuesto{alertBudgets.length !== 1 ? 's' : ''} en alerta
            </p>
            <p className="text-xs mt-0.5">
              {alertBudgets.map((b) => b.category_name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Summary header */}
      {totalBudgeted > 0 && (
        <div className="grid grid-cols-3 gap-4 rounded-xl border bg-card p-4 shadow-sm text-center">
          <div>
            <p className="text-xs text-muted-foreground">Presupuestado</p>
            <p className="text-lg font-bold tabular-nums">
              {new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(totalBudgeted)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Gastado</p>
            <p className="text-lg font-bold tabular-nums">
              {new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(totalSpent)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ejecución</p>
            <p className={`text-lg font-bold tabular-nums ${globalPct > 100 ? 'text-red-500' : globalPct > 80 ? 'text-orange-500' : 'text-emerald-600'}`}>
              {globalPct}%
            </p>
          </div>
        </div>
      )}

      {/* Grid */}
      {sorted.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">Todavía no tenés presupuestos.</p>
          <Button onClick={() => setFormOpen(true)} size="sm" className="mt-4 gap-1.5">
            <Plus className="size-4" />
            Crear el primero
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              locale={locale}
              onEdit={(budget) => setEditBudget(budget)}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setFormOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg lg:hidden"
        aria-label="Nuevo presupuesto"
      >
        <Plus className="size-5" />
      </button>

      {/* Create form */}
      <BudgetForm
        open={formOpen}
        onOpenChange={setFormOpen}
        categories={categories}
        defaultCurrency={currency}
        onSubmit={handleCreate}
        isPending={isPending}
      />

      {/* Edit form */}
      <BudgetForm
        open={!!editBudget}
        onOpenChange={(open) => { if (!open) setEditBudget(null) }}
        categories={categories}
        defaultCurrency={currency}
        budget={editBudget ?? undefined}
        onSubmit={handleUpdate}
        isPending={isPending}
      />
    </div>
  )
}

export function BudgetsClientSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => <BudgetCardSkeleton key={i} />)}
    </div>
  )
}
