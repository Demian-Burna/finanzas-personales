import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type Client = SupabaseClient<Database>

// Matches the JSONB structure returned by the dashboard_stats RPC
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

// Matches a row returned by the monthly_flow RPC
export interface MonthlyFlowPoint {
  month_start: string
  income: number
  expenses: number
  net: number
}

// supabase-js requires Database.Functions to be typed for full inference;
// these RPCs exist in the DB but not in the generated types yet.
type UntypedRpc = (
  fn: string,
  args?: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: PostgrestError | null }>

export async function getDashboardStats(
  client: Client,
  referenceDate?: string,
): Promise<{ data: DashboardStats | null; error: PostgrestError | null }> {
  const args: Record<string, unknown> = {}
  if (referenceDate) args['p_reference_date'] = referenceDate

  const { data, error } = await (client as unknown as { rpc: UntypedRpc }).rpc(
    'dashboard_stats',
    args,
  )

  return { data: data as DashboardStats | null, error }
}

export async function getMonthlyFlow(
  client: Client,
  months: number = 6,
): Promise<{ data: MonthlyFlowPoint[]; error: PostgrestError | null }> {
  const { data, error } = await (client as unknown as { rpc: UntypedRpc }).rpc(
    'monthly_flow',
    { p_months: months },
  )

  return {
    data: (data as MonthlyFlowPoint[] | null) ?? [],
    error,
  }
}
