'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { MonthlySummaryTab } from './MonthlySummaryTab'
import { CategoryBreakdownTab } from './CategoryBreakdownTab'
import { CashFlowTab } from './CashFlowTab'
import { NetWorthTab } from './NetWorthTab'
import type { DashboardStats, MonthlyFlowPoint } from '@/lib/supabase/queries/dashboard'
import type { AccountWithType } from '@/lib/supabase/queries/accounts'

interface SnapshotRow {
  snapshot_date: string
  net_worth: number
  total_assets: number
  total_liabilities: number
}

interface Props {
  initialStats: DashboardStats | null
  flow: MonthlyFlowPoint[]
  accounts: AccountWithType[]
  snapshots: SnapshotRow[]
  currency: string
  locale: string
  initialYear: number
  initialMonth: number
}

export function ReportsClient({
  initialStats,
  flow,
  accounts,
  snapshots,
  currency,
  locale,
  initialYear,
  initialMonth,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  // Month navigation pushes ?month=YYYY-MM so the page re-renders with fresh data
  function handleMonthChange(y: number, m: number) {
    const monthStr = `${y}-${String(m).padStart(2, '0')}`
    const next = new URLSearchParams(params.toString())
    next.set('month', monthStr)
    router.push(`${pathname}?${next.toString()}`)
  }

  return (
    <Tabs defaultValue="monthly" className="flex-col space-y-6">
      <TabsList variant="line" className="w-full justify-start border-b rounded-none px-0 bg-transparent h-auto pb-0 gap-0 overflow-x-auto flex-nowrap">
        <TabsTrigger value="monthly" className="rounded-none px-4 pb-3">Resumen mensual</TabsTrigger>
        <TabsTrigger value="category" className="rounded-none px-4 pb-3">Por categoría</TabsTrigger>
        <TabsTrigger value="cashflow" className="rounded-none px-4 pb-3">Flujo de caja</TabsTrigger>
        <TabsTrigger value="networth" className="rounded-none px-4 pb-3">Patrimonio neto</TabsTrigger>
      </TabsList>

      <TabsContent value="monthly">
        <MonthlySummaryTab
          stats={initialStats}
          currency={currency}
          locale={locale}
          year={initialYear}
          month={initialMonth}
          onMonthChange={handleMonthChange}
        />
      </TabsContent>

      <TabsContent value="category">
        <CategoryBreakdownTab currency={currency} locale={locale} />
      </TabsContent>

      <TabsContent value="cashflow">
        <CashFlowTab flow={flow} currency={currency} locale={locale} />
      </TabsContent>

      <TabsContent value="networth">
        <NetWorthTab
          snapshots={snapshots}
          accounts={accounts}
          currency={currency}
          locale={locale}
        />
      </TabsContent>
    </Tabs>
  )
}
