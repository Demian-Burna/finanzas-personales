import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { RecurringItemRow, RecurringItemInsert, RecurringItemUpdate } from '@/types/domain'

type Client = SupabaseClient<Database>

export interface RecurringItemWithRelations extends RecurringItemRow {
  account: { id: string; name: string; color: string | null } | null
  category: { id: string; name: string; color: string | null; icon: string | null } | null
}

const COLUMNS = [
  'id', 'user_id', 'account_id', 'category_id', 'currency_code', 'amount',
  'transaction_type', 'description', 'notes', 'frequency',
  'day_of_month', 'day_of_week', 'start_date', 'end_date',
  'next_occurrence_date', 'is_active', 'auto_create', 'advance_notice_days',
  'deleted_at', 'created_at', 'updated_at',
  'account:accounts!account_id(id,name,color)',
  'category:categories!category_id(id,name,color,icon)',
].join(',')

export async function getRecurringItems(
  client: Client,
): Promise<{ data: RecurringItemWithRelations[]; error: PostgrestError | null }> {
  const { data, error } = await client
    .from('recurring_items')
    .select(COLUMNS)
    .is('deleted_at', null)
    .order('next_occurrence_date', { ascending: true })

  return { data: (data as unknown as RecurringItemWithRelations[]) ?? [], error }
}

export async function getPendingRecurringItems(
  client: Client,
  asOfDate: string,
): Promise<{ data: RecurringItemWithRelations[]; error: PostgrestError | null }> {
  const { data, error } = await client
    .from('recurring_items')
    .select(COLUMNS)
    .is('deleted_at', null)
    .eq('is_active', true)
    .eq('auto_create', true)
    .lte('next_occurrence_date', asOfDate)

  return { data: (data as unknown as RecurringItemWithRelations[]) ?? [], error }
}

export async function createRecurringItem(
  client: Client,
  input: RecurringItemInsert,
): Promise<{ data: RecurringItemRow | null; error: PostgrestError | null }> {
  const { data, error } = await client
    .from('recurring_items')
    .insert(input as never)
    .select('id,user_id,description,frequency,next_occurrence_date,is_active,created_at,updated_at')
    .single()
  return { data, error }
}

export async function updateRecurringItem(
  client: Client,
  id: string,
  input: RecurringItemUpdate,
): Promise<{ data: RecurringItemRow | null; error: PostgrestError | null }> {
  const { data, error } = await client
    .from('recurring_items')
    .update(input as never)
    .eq('id', id)
    .is('deleted_at', null)
    .select('id,user_id,description,frequency,next_occurrence_date,is_active,created_at,updated_at')
    .single()
  return { data, error }
}

export async function deleteRecurringItem(
  client: Client,
  id: string,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await client
    .from('recurring_items')
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('id', id)
  return { error }
}
