import { createClient } from '@/lib/supabase/server'
import { getDashboardStats, getMonthlyFlow } from '@/lib/supabase/queries/dashboard'
import { FlowChart, FlowChartSkeleton } from '@/components/charts/FlowChart'
import { CategoryDonut, CategoryDonutSkeleton } from '@/components/charts/CategoryDonut'

interface Props {
  referenceDate: string
  currency: string
  locale: string
}

export async function ChartsSection({ referenceDate, currency, locale }: Props) {
  const supabase = await createClient()
  const [{ data: stats }, { data: flow }] = await Promise.all([
    getDashboardStats(supabase, referenceDate),
    getMonthlyFlow(supabase, 6),
  ])

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {flow.length > 0 ? (
        <FlowChart data={flow} currency={currency} locale={locale} />
      ) : (
        <FlowChartSkeleton />
      )}
      {stats?.top_categories && stats.top_categories.length > 0 ? (
        <CategoryDonut categories={stats.top_categories} currency={currency} locale={locale} />
      ) : (
        <CategoryDonutSkeleton />
      )}
    </div>
  )
}

export function ChartsSectionSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <FlowChartSkeleton />
      <CategoryDonutSkeleton />
    </div>
  )
}
