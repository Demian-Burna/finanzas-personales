'use client'

import { useState } from 'react'
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
  const [stats, setStats] = useState(initialStats)
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)

  async function handleMonthChange(y: number, m: number) {
    setYear(y)
    setMonth(m)
    // Fetch new stats client-side — reuse the RPC via API if needed
    // For now, clear stats to show "no data" state until server re-renders
    setStats(null)
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
          stats={stats}
          currency={currency}
          locale={locale}
          year={year}
          month={month}
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
