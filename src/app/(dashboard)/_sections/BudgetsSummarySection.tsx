import Link from 'next/link'
import type { BudgetWithProgress } from '@/lib/supabase/queries/budgets'

interface Props {
  budgets: BudgetWithProgress[]
  locale: string
}

function fmt(v: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
}

function progressColor(pct: number) {
  if (pct > 100) return 'var(--danger)'
  if (pct > 80) return 'var(--warn)'
  return 'var(--success)'
}

export function BudgetsSummarySection({ budgets, locale }: Props) {
  if (budgets.length === 0) return null

  const sorted = [...budgets]
    .filter(b => b.is_active)
    .sort((a, b) => {
      const pA = a.amount > 0 ? b.spent_amount / b.amount : 0
      const pB = b.amount > 0 ? b.spent_amount / b.amount : 0
      return pB - pA
    })
    .slice(0, 3)

  return (
    <div className="lg:hidden">
      <div className="flex items-baseline justify-between mb-2.5">
        <h2 className="text-[13px] font-semibold">Presupuestos</h2>
        <Link href="/budgets" className="text-xs-plus font-medium" style={{ color: 'var(--accent)' }}>
          Ver todos
        </Link>
      </div>
      <div className="space-y-2">
        {sorted.map((b) => {
          const pct = b.amount > 0 ? Math.round((b.spent_amount / b.amount) * 100) : 0
          const color = progressColor(pct)
          const over = pct > 100
          return (
            <div key={b.id} className="rounded-xl border bg-card px-3.5 py-3">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-lg leading-none shrink-0">{b.category_icon ?? '🎯'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold truncate">{b.category_name ?? 'Presupuesto'}</span>
                    <span className="text-sm font-bold tabular-nums shrink-0 ml-2" style={{ color }}>{pct}%</span>
                  </div>
                  <p className="text-xs-plus text-muted-foreground">
                    {b.period_type === 'monthly' ? 'Mensual' : b.period_type}
                  </p>
                </div>
              </div>
              <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
              </div>
              <div className="flex justify-between mt-1.5 text-[10.5px] text-muted-foreground tabular-nums">
                <span>{fmt(b.spent_amount, locale)} / {fmt(b.amount, locale)}</span>
                {over && <span className="font-semibold" style={{ color: 'var(--danger)' }}>+{fmt(b.spent_amount - b.amount, locale)}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
