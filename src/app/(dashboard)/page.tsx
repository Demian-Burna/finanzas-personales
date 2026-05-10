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

// Always render fresh — never serve a stale cached version when month changes
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Dashboard',
}

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await Promise.resolve(searchParams)
  const monthParam = typeof params.month === 'string' ? params.month : undefined

  // Derive referenceDate from URL param or current month
  let referenceDate: string
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    referenceDate = `${monthParam}-01`
  } else {
    const now = new Date()
    referenceDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  }

  // Single authenticated client — all queries share the same session
  const supabase = await createClient()

  // Fetch user prefs and all dashboard data in parallel
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

  // Period label
  const [yearStr, monthStr] = referenceDate.split('-')
  const monthIdx = parseInt(monthStr ?? '1', 10) - 1
  const periodLabel = `${MONTHS_ES[monthIdx] ?? ''} ${yearStr}`

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
