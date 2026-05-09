import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { BudgetRow, BudgetInsert, BudgetUpdate } from '@/types/domain'

type Client = SupabaseClient<Database>

// Return type of the budgets_with_progress RPC
export interface BudgetWithProgress {
  id: string
  user_id: string
  category_id: string
  category_name: string
  category_color: string | null
  category_icon: string | null
  period_type: string
  amount: number
  currency_code: string
  start_date: string
  end_date: string | null
  rollover_unused: boolean
  alert_threshold_pct: number
  is_active: boolean
  spent_amount: number
  period_start: string
  period_end: string
  days_elapsed: number
  days_in_period: number
  projected_total: number
  created_at: string
  updated_at: string
}

// supabase-js requires Database.Functions to be typed for full inference;
// these RPCs exist in the DB but not in the generated types yet.
type UntypedRpc = (
  fn: string,
  args?: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: PostgrestError | null }>

export async function getBudgetsWithProgress(
  client: Client,
  referenceDate?: string,
): Promise<{ data: BudgetWithProgress[]; error: PostgrestError | null }> {
  const args: Record<string, unknown> = {}
  if (referenceDate) args['p_reference_date'] = referenceDate

  const { data, error } = await (client as unknown as { rpc: UntypedRpc }).rpc(
    'budgets_with_progress',
    args,
  )

  return {
    data: (data as BudgetWithProgress[] | null) ?? [],
    error,
  }
}

// supabase-js cannot resolve Insert/Update types when defined as Omit<Row, ...>
// in the Database interface (circular self-reference during type evaluation).
// Using `as never` is intentional — the function signatures still enforce types for callers.
export async function createBudget(
  client: Client,
  input: BudgetInsert,
): Promise<{ data: BudgetRow | null; error: PostgrestError | null }> {
  const { data, error } = await client
    .from('budgets')
    .insert(input as never)
    .select('id,user_id,category_id,period_type,amount,currency_code,start_date,end_date,is_active,alert_threshold_pct,created_at,updated_at')
    .single()

  return { data, error }
}

export async function updateBudget(
  client: Client,
  id: string,
  input: BudgetUpdate,
): Promise<{ data: BudgetRow | null; error: PostgrestError | null }> {
  const { data, error } = await client
    .from('budgets')
    .update(input as never)
    .eq('id', id)
    .is('deleted_at', null)
    .select('id,user_id,category_id,period_type,amount,currency_code,start_date,end_date,is_active,alert_threshold_pct,created_at,updated_at')
    .single()

  return { data, error }
}

export async function deleteBudget(
  client: Client,
  id: string,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await client
    .from('budgets')
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('id', id)

  return { error }
}
