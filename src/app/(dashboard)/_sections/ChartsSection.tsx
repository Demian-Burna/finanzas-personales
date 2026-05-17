import Link from 'next/link'
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
    <>
      {/* Mobile: flow chart only, with section header */}
      <div className="lg:hidden">
        <div className="flex items-baseline justify-between mb-2.5">
          <h2 className="text-[13px] font-semibold">Flujo de los últimos 6 meses</h2>
          <Link href="/reports" className="text-xs-plus font-medium" style={{ color: 'var(--accent)' }}>
            Ver reporte
          </Link>
        </div>
        {flow.length > 0 ? (
          <div className="rounded-xl border bg-card p-3.5">
            <FlowChart data={flow} currency={currency} locale={locale} />
          </div>
        ) : (
          <FlowChartSkeleton />
        )}
      </div>

      {/* Desktop: both charts in a grid */}
      <div className="hidden lg:grid gap-4 lg:grid-cols-2">
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
    </>
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
