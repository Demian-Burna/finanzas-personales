// ============================================================
// Budgets — list with computed progress, CRUD
// ============================================================
// Progress (spent_amount + projection) is computed in-DB by the
// `budgets_with_progress(reference_date)` SQL function (one round
// trip, indexed scan over transactions).
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type {
  BudgetInsert,
  BudgetRow,
  BudgetUpdate,
  BudgetWithProgress,
  BudgetPeriod,
} from '@/types/domain'
import { unwrap, unwrapMaybe } from '../error'

type Client = SupabaseClient<Database>

const BUDGET_SELECT = `
  id,
  user_id,
  category_id,
  period_type,
  amount,
  currency_code,
  start_date,
  end_date,
  rollover_unused,
  alert_threshold_pct,
  is_active,
  deleted_at,
  created_at,
  updated_at
` as const

// ── List with progress ───────────────────────────────────────
// Calls the budgets_with_progress(p_reference_date) RPC. Returns
// active, non-deleted budgets with computed progress for the period
// containing referenceDate (defaults to today).
export async function listBudgetsWithProgress(
  supabase: Client,
  referenceDate?: string,
): Promise<BudgetWithProgress[]> {
  const args = referenceDate ? { p_reference_date: referenceDate } : {}
  const rows = unwrap(await supabase.rpc('budgets_with_progress', args))

  return rows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    category_id: r.category_id,
    period_type: r.period_type as BudgetPeriod,
    amount: Number(r.amount),
    currency_code: r.currency_code,
    start_date: r.start_date,
    end_date: r.end_date,
    rollover_unused: r.rollover_unused,
    alert_threshold_pct: r.alert_threshold_pct,
    is_active: r.is_active,
    deleted_at: null,
    created_at: r.created_at,
    updated_at: r.updated_at,
    category: {
      id: r.category_id,
      name: r.category_name,
      color: r.category_color,
      icon: r.category_icon,
    },
    spent_amount: Number(r.spent_amount),
    period_start: r.period_start,
    period_end: r.period_end,
    days_elapsed: r.days_elapsed,
    days_in_period: r.days_in_period,
    projected_total: Number(r.projected_total),
  }))
}

// ── Plain list (without progress) ────────────────────────────
export async function listBudgets(
  supabase: Client,
  userId: string,
  options: { activeOnly?: boolean } = {},
): Promise<BudgetRow[]> {
  const activeOnly = options.activeOnly ?? true
  let query = supabase
    .from('budgets')
    .select(BUDGET_SELECT)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('start_date', { ascending: false })

  if (activeOnly) query = query.eq('is_active', true)
  return unwrap(await query) as unknown as BudgetRow[]
}

// ── Get one ──────────────────────────────────────────────────
export async function getBudget(supabase: Client, id: string): Promise<BudgetRow | null> {
  const result = await supabase
    .from('budgets')
    .select(BUDGET_SELECT)
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  return unwrapMaybe(result) as unknown as BudgetRow | null
}

// ── Create ───────────────────────────────────────────────────
export async function createBudget(
  supabase: Client,
  input: BudgetInsert,
): Promise<BudgetRow> {
  const created = unwrap(
    await supabase.from('budgets').insert(input).select(BUDGET_SELECT).single(),
  )
  return created as unknown as BudgetRow
}

// ── Update ───────────────────────────────────────────────────
export async function updateBudget(
  supabase: Client,
  id: string,
  patch: BudgetUpdate,
): Promise<BudgetRow> {
  const updated = unwrap(
    await supabase.from('budgets').update(patch).eq('id', id).select(BUDGET_SELECT).single(),
  )
  return updated as unknown as BudgetRow
}

// ── Archive (soft delete) ────────────────────────────────────
export async function archiveBudget(supabase: Client, id: string): Promise<void> {
  unwrap(
    await supabase
      .from('budgets')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', id)
      .select('id'),
  )
}
