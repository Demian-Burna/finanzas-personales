'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Download } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { MobilePageHeader } from '@/components/layout/MobilePageHeader'
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
    <Tabs defaultValue="monthly" className="flex-col">
      <MobilePageHeader
        title="Reportes"
        action={
          <button className="flex size-9 items-center justify-center text-foreground" aria-label="Exportar">
            <Download className="size-[18px]" strokeWidth={1.75} />
          </button>
        }
      />
      <TabsList variant="line" className="w-full justify-start border-b rounded-none px-0 bg-transparent h-auto pb-0 gap-0 overflow-x-auto flex-nowrap">
        <TabsTrigger value="monthly"  className="rounded-none px-3 pb-3 lg:px-4">
          <span className="lg:hidden">Mensual</span>
          <span className="hidden lg:inline">Resumen mensual</span>
        </TabsTrigger>
        <TabsTrigger value="category" className="rounded-none px-3 pb-3 lg:px-4">
          <span className="lg:hidden">Categoría</span>
          <span className="hidden lg:inline">Por categoría</span>
        </TabsTrigger>
        <TabsTrigger value="cashflow" className="rounded-none px-3 pb-3 lg:px-4">
          <span className="lg:hidden">Flujo</span>
          <span className="hidden lg:inline">Flujo de caja</span>
        </TabsTrigger>
        <TabsTrigger value="networth" className="rounded-none px-3 pb-3 lg:px-4">
          <span className="lg:hidden">Patrimonio</span>
          <span className="hidden lg:inline">Patrimonio neto</span>
        </TabsTrigger>
      </TabsList>

      <div className="mt-4 lg:mt-6">
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
          stats={initialStats}
          currency={currency}
          locale={locale}
        />
      </TabsContent>
      </div>
    </Tabs>
  )
}
