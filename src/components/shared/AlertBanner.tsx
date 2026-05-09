import { AlertTriangle, Clock, Target } from 'lucide-react'
import type { BudgetWithProgress } from '@/lib/supabase/queries/budgets'
import { cn } from '@/lib/utils'

interface RecurringAlert {
  id: string
  name: string
  next_occurrence: string
  amount: number
  currency_code: string
}

interface GoalAlert {
  id: string
  name: string
  pct: number
}

interface Props {
  budgetsOverLimit: BudgetWithProgress[]
  upcomingRecurring: RecurringAlert[]
  goalsNearTarget: GoalAlert[]
  locale: string
}

function formatCurrency(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function daysUntil(dateStr: string): number {
  const now = new Date()
  const target = new Date(dateStr + 'T00:00:00')
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000)
}

export function AlertBanner({ budgetsOverLimit, upcomingRecurring, goalsNearTarget, locale }: Props) {
  const hasAlerts = budgetsOverLimit.length > 0 || upcomingRecurring.length > 0 || goalsNearTarget.length > 0
  if (!hasAlerts) return null

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
      <h2 className="text-sm font-semibold text-foreground">Alertas</h2>

      {budgetsOverLimit.map((b) => {
        const pct = b.amount > 0 ? (b.spent_amount / b.amount) * 100 : 0
        const isOver = pct > 100
        return (
          <div
            key={b.id}
            className={cn(
              'flex items-start gap-2 rounded-lg p-2.5 text-xs',
              isOver ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400',
            )}
          >
            <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
            <span>
              Presupuesto <strong>{b.category_name}</strong>:{' '}
              {isOver ? 'superado' : 'al límite'} ({pct.toFixed(0)}%)
            </span>
          </div>
        )
      })}

      {upcomingRecurring.map((r) => {
        const days = daysUntil(r.next_occurrence)
        return (
          <div key={r.id} className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 p-2.5 text-xs text-blue-700 dark:text-blue-400">
            <Clock className="size-3.5 mt-0.5 shrink-0" />
            <span>
              <strong>{r.name}</strong> vence en {days === 0 ? 'hoy' : `${days} día${days !== 1 ? 's' : ''}`} —{' '}
              {formatCurrency(r.amount, r.currency_code, locale)}
            </span>
          </div>
        )
      })}

      {goalsNearTarget.map((g) => (
        <div key={g.id} className="flex items-start gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2.5 text-xs text-emerald-700 dark:text-emerald-400">
          <Target className="size-3.5 mt-0.5 shrink-0" />
          <span>
            Meta <strong>{g.name}</strong> casi cumplida ({g.pct.toFixed(0)}%)
          </span>
        </div>
      ))}
    </div>
  )
}
