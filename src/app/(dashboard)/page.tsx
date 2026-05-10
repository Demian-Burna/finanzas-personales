import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getDashboardStats, getMonthlyFlow } from '@/lib/supabase/queries/dashboard'
import { getAccounts } from '@/lib/supabase/queries/accounts'
import { getTransactions } from '@/lib/supabase/queries/transactions'
import { getBudgetsWithProgress } from '@/lib/supabase/queries/budgets'
import { StatsSection } from './_sections/StatsSection'
import { ChartsSection } from './_sections/ChartsSection'
import { AccountsSection } from './_sections/AccountsSection'
import { RecentTransactionsSection } from './_sections/RecentTransactionsSection'
import { AlertsSection } from './_sections/AlertsSection'
import { RefMarker } from './_components/RefMarker'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Dashboard',
}

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export default async function OverviewPage() {
  // Dashboard always shows the current month — use Reports for other periods
  const now = new Date()
  const referenceDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const periodLabel = `${MONTHS_ES[now.getMonth()] ?? ''} ${now.getFullYear()}`

  const supabase = await createClient()

  const [
    profileResult,
    statsResult,
    flowResult,
    accountsResult,
    transactionsResult,
    budgetsResult,
  ] = await Promise.all([
    supabase.from('profiles').select('currency_code,locale').single(),
    getDashboardStats(supabase, referenceDate),
    getMonthlyFlow(supabase, 6),
    getAccounts(supabase),
    getTransactions(supabase, { pageSize: 5 }),
    getBudgetsWithProgress(supabase, referenceDate),
  ])

  const profile = profileResult.data as { currency_code: string | null; locale: string | null } | null
  const currency = profile?.currency_code ?? 'ARS'
  const locale = profile?.locale ?? 'es-AR'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resumen</h1>
        <p className="text-sm text-muted-foreground">{periodLabel}</p>
      </div>

      <AlertsSection budgets={budgetsResult.data ?? []} locale={locale} />

      <StatsSection data={statsResult.data} currency={currency} locale={locale} />

      <ChartsSection
        stats={statsResult.data}
        flow={flowResult.data}
        currency={currency}
        locale={locale}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <AccountsSection accounts={accountsResult.data ?? []} locale={locale} />
        <RecentTransactionsSection
          transactions={transactionsResult.data ?? []}
          currency={currency}
          locale={locale}
        />
      </div>

      <RefMarker />
    </div>
  )
}
