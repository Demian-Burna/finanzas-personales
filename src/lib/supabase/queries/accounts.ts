import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { AccountRow, AccountInsert, AccountUpdate } from '@/types/domain'

type Client = SupabaseClient<Database>

export interface AccountWithType extends AccountRow {
  account_type: {
    id: string
    name: string
    nature: 'asset' | 'liability'
    icon: string | null
  } | null
}

const ACCOUNT_COLUMNS = [
  'id', 'user_id', 'account_type_id', 'currency_code', 'name', 'description',
  'initial_balance', 'current_balance', 'color', 'icon',
  'is_active', 'include_in_net_worth', 'sort_order',
  'deleted_at', 'created_at', 'updated_at',
  // FK-hinted join — cast to AccountWithType at call sites
  'account_type:account_types!account_type_id(id,name,nature,icon)',
].join(',')

export async function getAccounts(
  client: Client,
): Promise<{ data: AccountWithType[]; error: PostgrestError | null }> {
  const { data, error } = await client
    .from('accounts')
    .select(ACCOUNT_COLUMNS)
    .is('deleted_at', null)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  return {
    data: (data as unknown as AccountWithType[]) ?? [],
    error,
  }
}

export async function getAccountById(
  client: Client,
  id: string,
): Promise<{ data: AccountWithType | null; error: PostgrestError | null }> {
  const { data, error } = await client
    .from('accounts')
    .select(ACCOUNT_COLUMNS)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  return { data: data as unknown as AccountWithType | null, error }
}

// supabase-js cannot resolve Insert/Update types when defined as Omit<Row, ...>
// in the Database interface (circular self-reference during type evaluation).
// Using `as never` is intentional — the function signatures still enforce types for callers.
export async function createAccount(
  client: Client,
  input: AccountInsert,
): Promise<{ data: AccountRow | null; error: PostgrestError | null }> {
  const { data, error } = await client
    .from('accounts')
    .insert(input as never)
    .select('id,user_id,account_type_id,currency_code,name,initial_balance,current_balance,is_active,created_at,updated_at')
    .single()

  return { data, error }
}

export async function updateAccount(
  client: Client,
  id: string,
  input: AccountUpdate,
): Promise<{ data: AccountRow | null; error: PostgrestError | null }> {
  const { data, error } = await client
    .from('accounts')
    .update(input as never)
    .eq('id', id)
    .is('deleted_at', null)
    .select('id,user_id,account_type_id,currency_code,name,initial_balance,current_balance,is_active,created_at,updated_at')
    .single()

  return { data, error }
}

export async function deleteAccount(
  client: Client,
  id: string,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await client
    .from('accounts')
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('id', id)

  return { error }
}
