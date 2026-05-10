import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { TransactionRow, TransactionInsert, TransactionUpdate } from '@/types/domain'

type Client = SupabaseClient<Database>

export interface TransactionWithRelations extends TransactionRow {
  account: {
    id: string
    name: string
    color: string | null
    currency_code: string
  } | null
  category: {
    id: string
    name: string
    color: string | null
    icon: string | null
  } | null
}

export interface TransactionFilters {
  accountId?: string
  categoryId?: string
  type?: 'income' | 'expense' | 'transfer'
  dateFrom?: string
  dateTo?: string
  search?: string
  /** ISO date string of the last fetched item (for cursor pagination) */
  cursorDate?: string
  /** UUID of the last fetched item (tie-breaker for same date) */
  cursorId?: string
  pageSize?: number
}

// Explicit column list — never select *
const TRANSACTION_COLUMNS = [
  'id', 'user_id', 'account_id', 'category_id',
  'transfer_account_id', 'transfer_transaction_id',
  'currency_code', 'amount', 'amount_in_base_currency', 'exchange_rate',
  'transaction_type', 'description', 'notes',
  'transaction_date', 'value_date', 'is_reconciled',
  'recurring_item_id', 'attachment_url', 'deleted_at',
  'created_at', 'updated_at',
  // FK-hinted joins — supabase-js doesn't infer nested types correctly,
  // so callers receive TransactionWithRelations via `as unknown as` cast below.
  'account:accounts!account_id(id,name,color,currency_code)',
  'category:categories!category_id(id,name,color,icon)',
].join(',')

export async function getTransactions(
  client: Client,
  filters: TransactionFilters = {},
): Promise<{ data: TransactionWithRelations[]; error: PostgrestError | null }> {
  const {
    accountId,
    categoryId,
    type,
    dateFrom,
    dateTo,
    search,
    cursorDate,
    cursorId,
    pageSize = 25,
  } = filters

  let query = client
    .from('transactions')
    .select(TRANSACTION_COLUMNS)
    .is('deleted_at', null)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(pageSize)

  if (accountId)  query = query.eq('account_id', accountId)
  if (categoryId) query = query.eq('category_id', categoryId)
  if (type)       query = query.eq('transaction_type', type)
  if (dateFrom)   query = query.gte('transaction_date', dateFrom)
  if (dateTo)     query = query.lte('transaction_date', dateTo)
  if (search)     query = query.ilike('description', `%${search}%`)

  // Composite cursor: rows where date < cursorDate, OR same date with id < cursorId
  if (cursorDate && cursorId) {
    query = query.or(
      `transaction_date.lt.${cursorDate},and(transaction_date.eq.${cursorDate},id.lt.${cursorId})`,
    )
  }

  const { data, error } = await query

  return {
    data: (data as unknown as TransactionWithRelations[]) ?? [],
    error,
  }
}

export async function getTransactionById(
  client: Client,
  id: string,
): Promise<{ data: TransactionWithRelations | null; error: PostgrestError | null }> {
  const { data, error } = await client
    .from('transactions')
    .select(TRANSACTION_COLUMNS)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  return { data: data as unknown as TransactionWithRelations | null, error }
}

// supabase-js cannot resolve Insert/Update types when defined as Omit<Row, ...>
// in the Database interface (circular self-reference during type evaluation).
// Using `as never` is intentional — the function signatures still enforce types for callers.
export async function createTransaction(
  client: Client,
  input: TransactionInsert,
): Promise<{ data: TransactionRow | null; error: PostgrestError | null }> {
  const { data, error } = await client
    .from('transactions')
    .insert(input as never)
    .select('id,user_id,account_id,category_id,currency_code,amount,transaction_type,description,transaction_date,created_at,updated_at')
    .single()

  return { data, error }
}

export async function updateTransaction(
  client: Client,
  id: string,
  input: TransactionUpdate,
): Promise<{ data: TransactionRow | null; error: PostgrestError | null }> {
  const { data, error } = await client
    .from('transactions')
    .update(input as never)
    .eq('id', id)
    .is('deleted_at', null)
    .select('id,user_id,account_id,category_id,currency_code,amount,transaction_type,description,transaction_date,created_at,updated_at')
    .single()

  return { data, error }
}

export async function deleteTransaction(
  client: Client,
  id: string,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await client
    .from('transactions')
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('id', id)

  return { error }
}
