import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getDashboardStats, getMonthlyFlow } from '@/lib/supabase/queries/dashboard'
import { getAccounts } from '@/lib/supabase/queries/accounts'
import { ReportsClient } from '@/components/reports/ReportsClient'
import { ensureMonthlySnapshotAction } from './actions'

export const metadata: Metadata = { title: 'Reportes' }

async function getUserPrefs() {
  const supabase = await createClient()
  const { data: profileRaw } = await supabase.from('profiles').select('base_currency,locale').single()
  const profile = profileRaw as { base_currency: string | null; locale: string | null } | null
  return { currency: profile?.base_currency ?? 'ARS', locale: profile?.locale ?? 'es-AR' }
}

export default async function ReportsPage() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const referenceDate = `${year}-${String(month).padStart(2, '0')}-01`

  const supabase = await createClient()
  const { data: _authData } = await supabase.auth.getUser(); const user = _authData?.user ?? null

  // Ensure last month snapshot exists (fire-and-forget style â€” non-blocking)
  void ensureMonthlySnapshotAction()

  const [{ currency, locale }, { data: stats }, { data: flow }, { data: accounts }] = await Promise.all([
    getUserPrefs(),
    getDashboardStats(supabase, referenceDate),
    getMonthlyFlow(supabase, 12),
    getAccounts(supabase),
  ])

  // Load snapshots for net worth chart
  const { data: snapshotRaw } = user
    ? await supabase
        .from('monthly_snapshots')
        .select('snapshot_date,net_worth,total_assets,total_liabilities')
        .eq('user_id', user.id)
        .order('snapshot_date', { ascending: true })
        .limit(24)
    : { data: [] }

  const snapshots = (snapshotRaw ?? []) as Array<{
    snapshot_date: string
    net_worth: number
    total_assets: number
    total_liabilities: number
  }>

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
        <p className="text-sm text-muted-foreground">Análisis y visualización de tus finanzas</p>
      </div>

      <ReportsClient
        initialStats={stats}
        flow={flow}
        accounts={accounts}
        snapshots={snapshots}
        currency={currency}
        locale={locale}
        initialYear={year}
        initialMonth={month}
      />
    </div>
  )
}
