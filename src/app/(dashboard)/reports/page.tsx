import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getDashboardStats, getMonthlyFlow } from '@/lib/supabase/queries/dashboard'
import { getAccounts } from '@/lib/supabase/queries/accounts'
import { ReportsClient } from '@/components/reports/ReportsClient'
import { ensureMonthlySnapshotAction } from './actions'

export const metadata: Metadata = { title: 'Reportes' }

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await Promise.resolve(searchParams)
  const monthParam = typeof params.month === 'string' ? params.month : undefined

  // Derive referenceDate from ?month=YYYY-MM or fall back to current month
  let referenceDate: string
  let year: number
  let month: number

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    referenceDate = `${monthParam}-01`
    year = parseInt(monthParam.split('-')[0]!, 10)
    month = parseInt(monthParam.split('-')[1]!, 10)
  } else {
    const now = new Date()
    year = now.getFullYear()
    month = now.getMonth() + 1
    referenceDate = `${year}-${String(month).padStart(2, '0')}-01`
  }

  const supabase = await createClient()
  const { data: _authData } = await supabase.auth.getUser()
  const user = _authData?.user ?? null

  // Ensure last month snapshot exists (fire-and-forget — non-blocking)
  void ensureMonthlySnapshotAction()

  const [profileResult, statsResult, flowResult, accountsResult] = await Promise.all([
    supabase.from('profiles').select('currency_code,locale').single(),
    getDashboardStats(supabase, referenceDate),
    getMonthlyFlow(supabase, 12),
    getAccounts(supabase),
  ])

  const profile = profileResult.data as { currency_code: string | null; locale: string | null } | null
  const currency = profile?.currency_code ?? 'ARS'
  const locale = profile?.locale ?? 'es-AR'

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
    <div>
      <div className="hidden lg:block mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
        <p className="text-sm text-muted-foreground">Análisis y visualización de tus finanzas</p>
      </div>

      <ReportsClient
        initialStats={statsResult.data}
        flow={flowResult.data}
        accounts={accountsResult.data ?? []}
        snapshots={snapshots}
        currency={currency}
        locale={locale}
        initialYear={year}
        initialMonth={month}
      />
    </div>
  )
}
