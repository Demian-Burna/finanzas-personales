// ============================================================
// Dashboard — aggregated stats and time-series for the overview
// ============================================================
// All numbers are computed inside Postgres in a single call:
//   dashboard_stats() — current/previous month flows + top categories
//   monthly_flow()    — N months of income/expenses/net for the chart
// This avoids N+1 round trips and keeps the response payload small.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { unwrap } from '../error'

type Client = SupabaseClient<Database>

// ── Shape of the dashboard_stats() jsonb response ────────────
export interface DashboardStats {
  period: {
    reference_date: string
    start: string
    end: string
  }
  net_worth: number
  assets: number
  liabilities: number
  current_month: {
    income: number
    expenses: number
    net: number
    /** Computed as ((income - expenses) / income * 100), rounded 2dp. 0 if no income. */
    savings_rate: number
  }
  previous_month: {
    income: number
    expenses: number
    net: number
  }
  top_categories: Array<{
    id: string
    name: string
    color: string | null
    icon: string | null
    total: number
  }>
}

export async function getDashboardStats(
  supabase: Client,
  referenceDate?: string,
): Promise<DashboardStats> {
  const args = referenceDate ? { p_reference_date: referenceDate } : {}
  const json = unwrap(await supabase.rpc('dashboard_stats', args))
  return json as unknown as DashboardStats
}

// ── Monthly flow (last N months) ─────────────────────────────
export interface MonthlyFlowPoint {
  month_start: string
  income: number
  expenses: number
  net: number
}

export async function getMonthlyFlow(
  supabase: Client,
  months = 6,
): Promise<MonthlyFlowPoint[]> {
  const rows = unwrap(await supabase.rpc('monthly_flow', { p_months: months }))
  return rows.map((r) => ({
    month_start: r.month_start,
    income: Number(r.income),
    expenses: Number(r.expenses),
    net: Number(r.net),
  }))
}

// ── Recent transactions for the dashboard panel ─────────────
import type { TransactionWithRelations } from '@/types/domain'
import { listTransactions } from './transactions'

export async function getRecentTransactions(
  supabase: Client,
  userId: string,
  limit = 5,
): Promise<TransactionWithRelations[]> {
  const page = await listTransactions(supabase, userId, { limit })
  return page.items
}

// ── Active alerts summary ────────────────────────────────────
// Pulls the small set of "things the user should know about" cards
// in a single round-trip: budgets near/over their threshold and
// recurring items due in the next 7 days.
export interface DashboardAlerts {
  budgets_at_risk: Array<{
    id: string
    category_name: string
    spent_amount: number
    amount: number
    pct: number
  }>
  upcoming_recurring: Array<{
    id: string
    description: string
    amount: number
    next_occurrence_date: string
    days_until: number
  }>
}

export async function getDashboardAlerts(
  supabase: Client,
  userId: string,
): Promise<DashboardAlerts> {
  // Budgets in-progress data already comes with thresholds; reuse it.
  const budgets = unwrap(await supabase.rpc('budgets_with_progress', {}))
  const budgets_at_risk = budgets
    .filter((b) => Number(b.amount) > 0)
    .map((b) => ({
      id: b.id,
      category_name: b.category_name,
      spent_amount: Number(b.spent_amount),
      amount: Number(b.amount),
      pct: (Number(b.spent_amount) / Number(b.amount)) * 100,
    }))
    .filter((b) => b.pct >= 80)
    .sort((a, z) => z.pct - a.pct)
    .slice(0, 5)

  const today = new Date()
  const horizonDate = new Date(today)
  horizonDate.setDate(today.getDate() + 7)
  const todayIso = today.toISOString().slice(0, 10)
  const horizonIso = horizonDate.toISOString().slice(0, 10)

  const recurring = unwrap(
    await supabase
      .from('recurring_items')
      .select('id, description, amount, next_occurrence_date')
      .eq('user_id', userId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .not('next_occurrence_date', 'is', null)
      .gte('next_occurrence_date', todayIso)
      .lte('next_occurrence_date', horizonIso)
      .order('next_occurrence_date', { ascending: true })
      .limit(10),
  )

  const upcoming_recurring = recurring.map((r) => {
    const occ = new Date(r.next_occurrence_date as string)
    const days_until = Math.max(
      0,
      Math.floor((occ.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
    )
    return {
      id: r.id,
      description: r.description,
      amount: Number(r.amount),
      next_occurrence_date: r.next_occurrence_date as string,
      days_until,
    }
  })

  return { budgets_at_risk, upcoming_recurring }
}
