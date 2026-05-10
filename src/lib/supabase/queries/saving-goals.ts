import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { SavingGoalRow, SavingGoalInsert, SavingGoalUpdate, GoalContributionInsert } from '@/types/domain'

type Client = SupabaseClient<Database>

export interface GoalContributionRow {
  id: string
  goal_id: string
  transaction_id: string | null
  amount: number
  note: string | null
  contribution_date: string
  created_at: string
}

export interface SavingGoalWithContributions extends SavingGoalRow {
  contributions: GoalContributionRow[]
}

const GOAL_COLUMNS = [
  'id', 'user_id', 'account_id', 'currency_code', 'name', 'description',
  'target_amount', 'current_amount', 'target_date', 'status',
  'color', 'icon', 'created_at', 'updated_at',
  'goal_contributions(id,goal_id,transaction_id,amount,note,contribution_date,created_at)',
].join(',')

export async function getSavingGoals(
  client: Client,
): Promise<{ data: SavingGoalWithContributions[]; error: PostgrestError | null }> {
  const { data, error } = await client
    .from('saving_goals')
    .select(GOAL_COLUMNS)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })

  return { data: (data as unknown as SavingGoalWithContributions[]) ?? [], error }
}

export async function createSavingGoal(
  client: Client,
  input: SavingGoalInsert,
): Promise<{ data: SavingGoalRow | null; error: PostgrestError | null }> {
  const { data, error } = await client
    .from('saving_goals')
    .insert(input as never)
    .select('id,user_id,name,target_amount,current_amount,status,created_at,updated_at')
    .single()
  return { data, error }
}

export async function updateSavingGoal(
  client: Client,
  id: string,
  input: SavingGoalUpdate,
): Promise<{ data: SavingGoalRow | null; error: PostgrestError | null }> {
  const { data, error } = await client
    .from('saving_goals')
    .update(input as never)
    .eq('id', id)
    .select('id,user_id,name,target_amount,current_amount,status,created_at,updated_at')
    .single()
  return { data, error }
}

export async function addGoalContribution(
  client: Client,
  input: GoalContributionInsert,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await client
    .from('goal_contributions')
    .insert(input as never)
  return { error }
}
