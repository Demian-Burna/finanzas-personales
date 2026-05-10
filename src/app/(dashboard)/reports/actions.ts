'use server'

import { createClient } from '@/lib/supabase/server'
import { getMonthlyFlow } from '@/lib/supabase/queries/dashboard'
import { getAccounts } from '@/lib/supabase/queries/accounts'

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

// â”€â”€ Snapshot mensual â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function ensureMonthlySnapshotAction(): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: _authData } = await supabase.auth.getUser(); const user = _authData?.user ?? null
  if (!user) return { ok: false, error: 'No autenticado' }

  // Previous month
  const now = new Date()
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const snapshotDate = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}-01`

  // Check if snapshot already exists
  const { data: existing } = await supabase
    .from('monthly_snapshots')
    .select('id')
    .eq('user_id', user.id)
    .eq('snapshot_date', snapshotDate)
    .maybeSingle()

  if (existing) return { ok: true, data: undefined }

  // Calculate net worth from accounts
  const { data: accounts } = await getAccounts(supabase)
  const netWorth = accounts.reduce((sum, a) => {
    return a.account_type?.nature === 'liability'
      ? sum - a.current_balance
      : sum + a.current_balance
  }, 0)

  const assets = accounts
    .filter((a) => a.account_type?.nature !== 'liability')
    .reduce((sum, a) => sum + a.current_balance, 0)

  const liabilities = accounts
    .filter((a) => a.account_type?.nature === 'liability')
    .reduce((sum, a) => sum + a.current_balance, 0)

  await supabase.from('monthly_snapshots').upsert({
    user_id: user.id,
    snapshot_date: snapshotDate,
    net_worth: netWorth,
    total_assets: assets,
    total_liabilities: liabilities,
  } as never)

  return { ok: true, data: undefined }
}

// â”€â”€ CSV exports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function exportMonthlySummaryAction(
  year: number,
  month: number,
): Promise<ActionResult<string>> {
  const supabase = await createClient()
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const to = new Date(year, month, 0).toISOString().split('T')[0] ?? ''

  const { data } = await supabase
    .from('transactions')
    .select('transaction_date,description,transaction_type,amount,currency_code,category:categories!category_id(name),account:accounts!account_id(name)')
    .is('deleted_at', null)
    .gte('transaction_date', from)
    .lte('transaction_date', to)
    .order('transaction_date', { ascending: false })

  const rows = (data as unknown as Array<{
    transaction_date: string
    description: string | null
    transaction_type: string
    amount: number
    currency_code: string
    category: { name: string } | null
    account: { name: string } | null
  }> ?? [])

  const header = 'Fecha,Descripción,Tipo,Categoría,Cuenta,Monto,Moneda'
  const lines = rows.map((r) =>
    [r.transaction_date, `"${r.description ?? ''}"`, r.transaction_type, `"${r.category?.name ?? ''}"`, `"${r.account?.name ?? ''}"`, r.amount, r.currency_code].join(','),
  )

  return { ok: true, data: [header, ...lines].join('\n') }
}

export async function exportCategoryBreakdownAction(
  from: string,
  to: string,
): Promise<ActionResult<string>> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('transactions')
    .select('amount,category:categories!category_id(name)')
    .is('deleted_at', null)
    .eq('transaction_type', 'expense')
    .gte('transaction_date', from)
    .lte('transaction_date', to)

  const rows = data as unknown as Array<{ amount: number; category: { name: string } | null }> ?? []

  const totals: Record<string, number> = {}
  for (const r of rows) {
    const cat = r.category?.name ?? 'Sin categoría'
    totals[cat] = (totals[cat] ?? 0) + r.amount
  }

  const total = Object.values(totals).reduce((a, b) => a + b, 0)
  const sorted = Object.entries(totals).sort(([, a], [, b]) => b - a)

  const header = 'Categoría,Monto,Porcentaje'
  const lines = sorted.map(([cat, amt]) =>
    `"${cat}",${amt.toFixed(2)},${total > 0 ? ((amt / total) * 100).toFixed(1) : '0'}%`,
  )

  return { ok: true, data: [header, ...lines].join('\n') }
}

export async function exportCashFlowAction(): Promise<ActionResult<string>> {
  const supabase = await createClient()
  const { data: flow } = await getMonthlyFlow(supabase, 12)

  const header = 'Mes,Ingresos,Gastos,Balance'
  const lines = flow.map((p) =>
    `${p.month_start},${p.income.toFixed(2)},${p.expenses.toFixed(2)},${p.net.toFixed(2)}`,
  )

  return { ok: true, data: [header, ...lines].join('\n') }
}

export async function exportNetWorthAction(): Promise<ActionResult<string>> {
  const supabase = await createClient()
  const { data: _authData } = await supabase.auth.getUser(); const user = _authData?.user ?? null
  if (!user) return { ok: false, error: 'No autenticado' }

  const { data } = await supabase
    .from('monthly_snapshots')
    .select('snapshot_date,net_worth,total_assets,total_liabilities')
    .eq('user_id', user.id)
    .order('snapshot_date', { ascending: true })

  const rows = data as Array<{ snapshot_date: string; net_worth: number; total_assets: number; total_liabilities: number }> ?? []

  const header = 'Mes,Activos,Pasivos,Patrimonio Neto'
  const lines = rows.map((r) =>
    `${r.snapshot_date},${r.total_assets.toFixed(2)},${r.total_liabilities.toFixed(2)},${r.net_worth.toFixed(2)}`,
  )

  return { ok: true, data: [header, ...lines].join('\n') }
}
