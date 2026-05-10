import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { StatsSection, StatsSectionSkeleton } from './_sections/StatsSection'
import { ChartsSection, ChartsSectionSkeleton } from './_sections/ChartsSection'
import { AccountsSection, AccountsSkeleton } from './_sections/AccountsSection'
import { RecentTransactionsSection, RecentTransactionsSkeleton } from './_sections/RecentTransactionsSection'
import { AlertsSection } from './_sections/AlertsSection'

export const metadata: Metadata = {
  title: 'Dashboard',
}

// Reads currency/locale from user profile; falls back to ARS / es-AR
async function getUserPrefs(): Promise<{ currency: string; locale: string; referenceDate: string }> {
  const supabase = await createClient()
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('base_currency,locale')
    .single()

  const profile = profileRaw as { base_currency: string | null; locale: string | null } | null

  const now = new Date()
  const referenceDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  return {
    currency: profile?.base_currency ?? 'ARS',
    locale: profile?.locale ?? 'es-AR',
    referenceDate,
  }
}

export default async function OverviewPage() {
  const { currency, locale, referenceDate } = await getUserPrefs()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resumen</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Alerts — no skeleton, hidden when empty */}
      <Suspense fallback={null}>
        <AlertsSection referenceDate={referenceDate} locale={locale} />
      </Suspense>

      {/* Stats cards */}
      <Suspense fallback={<StatsSectionSkeleton />}>
        <StatsSection referenceDate={referenceDate} currency={currency} locale={locale} />
      </Suspense>

      {/* Flow chart + category donut */}
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
    </div>
  )
}
