'use client'

import { useState, useTransition } from 'react'
import { Plus, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import type { BudgetWithProgress } from '@/lib/supabase/queries/budgets'
import type { CategoryWithParent } from '@/lib/supabase/queries/categories'
import type { BudgetInput } from '@/lib/validations/budget'
import { BudgetCard, BudgetCardSkeleton } from '@/components/shared/BudgetCard'
import { EmptyCard } from '@/components/shared/EmptyCard'
import { BudgetForm } from '@/components/forms/BudgetForm'
import { MobilePageHeader } from '@/components/layout/MobilePageHeader'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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

function fmt(v: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
}

// Simple SVG donut
function MobileDonut({ pct, color }: { pct: number; color: string }) {
  const r = 44, size = 108, thick = 14
  const circ = 2 * Math.PI * r
  const dash = (Math.min(pct, 100) / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={thick} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={thick}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2 - 4} textAnchor="middle" fontSize={20} fontWeight={700} fill="var(--foreground)" fontFamily="Inter">{pct}%</text>
      <text x={size / 2} y={size / 2 + 13} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)" fontFamily="Inter">ejecutado</text>
    </svg>
  )
}

export function BudgetsClient({ budgets, categories, currency, locale }: Props) {
  const [formOpen, setFormOpen] = useState(false)
  const [editBudget, setEditBudget] = useState<BudgetWithProgress | null>(null)
  const [isPending, startTransition] = useTransition()

  const activeBudgets = budgets.filter((b) => b.is_active)
  const alertBudgets = activeBudgets.filter(
    (b) => b.amount > 0 && (b.spent_amount / b.amount) * 100 >= b.alert_threshold_pct,
  )

  const totalBudgeted = activeBudgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent = activeBudgets.reduce((s, b) => s + b.spent_amount, 0)
  const globalPct = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0

  const donutColor = globalPct > 100 ? 'var(--danger)' : globalPct > 80 ? 'var(--warn)' : 'var(--success)'

  const sorted = [...budgets].sort((a, b) => {
    const pA = a.amount > 0 ? (b.spent_amount / b.amount) : 0
    const pB = b.amount > 0 ? (b.spent_amount / b.amount) : 0
    return pB - pA
  })

  const needsAttention = sorted.filter(b => b.is_active && b.amount > 0 && (b.spent_amount / b.amount) * 100 >= b.alert_threshold_pct)
  const others = sorted.filter(b => !needsAttention.includes(b))

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

  return (
    <div>
      {/* Mobile page header */}
      <MobilePageHeader
        title="Presupuestos"
        action={
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-1 rounded-lg bg-foreground px-2.5 py-1.5 text-[12px] font-semibold text-background"
          >
            <Plus className="size-3.5" strokeWidth={2} /> Nuevo
          </button>
        }
      />

      {/* ── Mobile layout ── */}
      <div className="lg:hidden">
        {sorted.length === 0 ? (
          <div className="px-4 pt-4">
            <EmptyCard
              emoji="🎯"
              title="Sin presupuestos activos"
              description="Definí un tope mensual para tus categorías más gastonas. Te avisamos cuando estés cerca del límite."
              ctaLabel="Crear el primero"
              onCta={() => setFormOpen(true)}
            />
          </div>
        ) : (
          <div className="px-4 pt-4 pb-6 space-y-5">
            {/* Donut summary */}
            {totalBudgeted > 0 && (
              <div className="flex items-center gap-4">
                <MobileDonut pct={globalPct} color={donutColor} />
                <div className="flex-1">
                  <p className="text-xl font-bold tabular-nums">{fmt(totalSpent, currency, locale)}</p>
                  <p className="text-xs-plus text-muted-foreground mt-0.5">de {fmt(totalBudgeted, currency, locale)} presupuestado</p>
                  {alertBudgets.length > 0 && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="size-3.5 shrink-0" />
                      {alertBudgets.length} categoría{alertBudgets.length !== 1 ? 's' : ''} excedida{alertBudgets.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Needs attention */}
            {needsAttention.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Requieren atención</p>
                <div className="space-y-2">
                  {needsAttention.map((b) => (
                    <BudgetCard key={b.id} budget={b} locale={locale} onEdit={setEditBudget} onToggleActive={handleToggleActive} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            )}

            {/* Other categories */}
            {others.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {needsAttention.length > 0 ? 'Otras categorías' : 'Presupuestos'}
                </p>
                <div className="space-y-2">
                  {others.map((b) => (
                    <BudgetCard key={b.id} budget={b} locale={locale} onEdit={setEditBudget} onToggleActive={handleToggleActive} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden lg:block space-y-5">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setFormOpen(true)} className="gap-1.5">
            <Plus className="size-4" /> Nuevo presupuesto
          </Button>
        </div>

        {alertBudgets.length > 0 && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{alertBudgets.length} presupuesto{alertBudgets.length !== 1 ? 's' : ''} en alerta</p>
              <p className="text-xs mt-0.5">{alertBudgets.map((b) => b.category_name).join(', ')}</p>
            </div>
          </div>
        )}

        {totalBudgeted > 0 && (
          <div className="grid grid-cols-3 gap-4 rounded-xl border bg-card p-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Presupuestado</p>
              <p className="text-lg font-bold tabular-nums">{fmt(totalBudgeted, currency, locale)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gastado</p>
              <p className="text-lg font-bold tabular-nums">{fmt(totalSpent, currency, locale)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ejecución</p>
              <p className={cn('text-lg font-bold tabular-nums', globalPct > 100 ? 'text-red-500' : globalPct > 80 ? 'text-orange-500' : 'text-emerald-600')}>{globalPct}%</p>
            </div>
          </div>
        )}

        {sorted.length === 0 ? (
          <EmptyCard emoji="🎯" title="Sin presupuestos activos" description="Definí un tope mensual para tus categorías más gastonas." ctaLabel="Crear el primero" onCta={() => setFormOpen(true)} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((b) => (
              <BudgetCard key={b.id} budget={b} locale={locale} onEdit={setEditBudget} onToggleActive={handleToggleActive} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      <BudgetForm open={formOpen} onOpenChange={setFormOpen} categories={categories} defaultCurrency={currency} onSubmit={handleCreate} isPending={isPending} />
      <BudgetForm open={!!editBudget} onOpenChange={(o) => { if (!o) setEditBudget(null) }} categories={categories} defaultCurrency={currency} budget={editBudget ?? undefined} onSubmit={handleUpdate} isPending={isPending} />
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
