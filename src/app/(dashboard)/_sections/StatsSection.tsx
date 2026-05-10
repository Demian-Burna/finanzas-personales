import { createClient } from '@/lib/supabase/server'
import { getDashboardStats } from '@/lib/supabase/queries/dashboard'
import { StatCard, StatCardSkeleton } from '@/components/shared/StatCard'

interface Props {
  referenceDate: string
  currency: string
  locale: string
}

export async function StatsSection({ referenceDate, currency, locale }: Props) {
  const supabase = await createClient()
  const { data } = await getDashboardStats(supabase, referenceDate)

  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
    )
  }

  // RPC already returns savings_rate as a percentage (e.g. 35.5 means 35.5%)
  const savingsRate = data.current_month.savings_rate
  const prevSavingsRate = data.previous_month.income > 0
    ? ((data.previous_month.income - data.previous_month.expenses) / data.previous_month.income) * 100
    : 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Balance total"
        value={data.net_worth}
        currency={currency}
        locale={locale}
      />
      <StatCard
        title="Ingresos del mes"
        value={data.current_month.income}
        previousValue={data.previous_month.income}
        currency={currency}
        locale={locale}
      />
      <StatCard
        title="Gastos del mes"
        value={data.current_month.expenses}
        previousValue={data.previous_month.expenses}
        currency={currency}
        locale={locale}
        invertTrend
      />
      <StatCard
        title="Tasa de ahorro"
        value={savingsRate}
        previousValue={prevSavingsRate}
        currency={currency}
        locale={locale}
        isPercentage
      />
    </div>
  )
}

export function StatsSectionSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
    </div>
  )
}
