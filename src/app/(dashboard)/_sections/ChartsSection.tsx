import { FlowChart, FlowChartSkeleton } from '@/components/charts/FlowChart'
import { CategoryDonut, CategoryDonutSkeleton } from '@/components/charts/CategoryDonut'
import type { DashboardStats, MonthlyFlowPoint } from '@/lib/supabase/queries/dashboard'

interface Props {
  stats: DashboardStats | null
  flow: MonthlyFlowPoint[]
  currency: string
  locale: string
}

export function ChartsSection({ stats, flow, currency, locale }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {flow.length > 0 ? (
        <FlowChart data={flow} currency={currency} locale={locale} />
      ) : (
        <FlowChartSkeleton />
      )}
      {stats?.top_categories && stats.top_categories.length > 0 ? (
        <CategoryDonut
          categories={stats.top_categories}
          currency={currency}
          locale={locale}
        />
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
