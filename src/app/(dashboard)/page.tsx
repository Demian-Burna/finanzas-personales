import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { StatsSection, StatsSectionSkeleton } from './_sections/StatsSection'
import { ChartsSection, ChartsSectionSkeleton } from './_sections/ChartsSection'
import { AccountsSection, AccountsSkeleton } from './_sections/AccountsSection'
import { RecentTransactionsSection, RecentTransactionsSkeleton } from './_sections/RecentTransactionsSection'
import { AlertsSection } from './_sections/AlertsSection'
import { RefMarker } from './_components/RefMarker'

export const metadata: Metadata = {
  title: 'Dashboard',
}

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

async function getUserPrefs(month: string | undefined): Promise<{ currency: string; locale: string; referenceDate: string }> {
  const supabase = await createClient()
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('base_currency,locale')
    .single()

  const profile = profileRaw as { base_currency: string | null; locale: string | null } | null

  // Read period from ?month=YYYY-MM URL param, fall back to current month
  let referenceDate: string
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    referenceDate = `${month}-01`
  } else {
    const now = new Date()
    referenceDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  }

  return {
    currency: profile?.base_currency ?? 'ARS',
    locale: profile?.locale ?? 'es-AR',
    referenceDate,
  }
}

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await Promise.resolve(searchParams)
  const monthParam = typeof params.month === 'string' ? params.month : undefined

  const { currency, locale, referenceDate } = await getUserPrefs(monthParam)

  // Derive display label from referenceDate
  const [yearStr, monthStr] = referenceDate.split('-')
  const monthIdx = parseInt(monthStr ?? '1', 10) - 1
  const periodLabel = `${MONTHS_ES[monthIdx] ?? ''} ${yearStr}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resumen</h1>
        <p className="text-sm text-muted-foreground">{periodLabel}</p>
      </div>

      {/* Alerts */}
      <Suspense fallback={null}>
        <AlertsSection referenceDate={referenceDate} locale={locale} />
      </Suspense>

      {/* Stats cards */}
      <Suspense fallback={<StatsSectionSkeleton />}>
        <StatsSection referenceDate={referenceDate} currency={currency} locale={locale} />
      </Suspense>

      {/* Charts */}
      <Suspense fallback={<ChartsSectionSkeleton />}>
        <ChartsSection referenceDate={referenceDate} currency={currency} locale={locale} />
      </Suspense>

      {/* Accounts + recent transactions */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Suspense fallback={<AccountsSkeleton />}>
          <AccountsSection locale={locale} />
        </Suspense>
        <Suspense fallback={<RecentTransactionsSkeleton />}>
          <RecentTransactionsSection currency={currency} locale={locale} />
        </Suspense>
      </div>

      <RefMarker />
    </div>
  )
}
