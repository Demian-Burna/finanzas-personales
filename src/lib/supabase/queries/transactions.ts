// ============================================================
// Transactions — list, filter, paginate, mutate
// ============================================================
// Performance notes:
//   • All SELECTs use explicit columns — never `*` — so adding
//     columns to the DB doesn't bloat the over-the-wire payload.
//   • Pagination is cursor-based on (transaction_date, id) which
//     is supported by the idx_txn_user_date partial index. Avoids
//     OFFSET (which scales O(n) with the offset).
//   • Soft delete: queries filter `deleted_at IS NULL` server-side.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type {
  TransactionInsert,
  TransactionUpdate,
  TransactionWithRelations,
  TransactionType,
} from '@/types/domain'
import type { CursorPage } from '@/types'
import { unwrap, unwrapMaybe } from '../error'

type Client = SupabaseClient<Database>

// ── Column projection used everywhere ────────────────────────
// Explicit list — ergonomic + cheap on the wire.
const TRANSACTION_SELECT = `
  id,
  user_id,
  account_id,
  category_id,
  transfer_account_id,
  transfer_transaction_id,
  currency_code,
  amount,
  amount_in_base_currency,
  exchange_rate,
  transaction_type,
  description,
  notes,
  transaction_date,
  value_date,
  is_reconciled,
  recurring_item_id,
  attachment_url,
  deleted_at,
  created_at,
  updated_at,
  category:categories!transactions_category_id_fkey (
    id, name, color, icon, transaction_type
  ),
  account:accounts!transactions_account_id_fkey (
    id, name, icon, color, currency_code
  ),
  transfer_account:accounts!transactions_transfer_account_id_fkey (
    id, name, icon, color, currency_code
  )
` as const

// ── Filters ──────────────────────────────────────────────────
export interface TransactionFilters {
  /** ISO date (inclusive). */
  fromDate?: string
  /** ISO date (inclusive). */
  toDate?: string
  /** Filter by income/expense/transfer. */
  type?: TransactionType
  accountId?: string
  categoryId?: string
  /** Free-text search over description and notes. */
  search?: string
  minAmount?: number
  maxAmount?: number
  isReconciled?: boolean
}

export interface TransactionPageOptions extends TransactionFilters {
  /** Items per page. Default 50. Max 200. */
  limit?: number
  /** Cursor returned by a previous call (or null for first page). */
  cursor?: TransactionCursor | null
}

/**
 * Composite cursor: ordering by transaction_date DESC then id DESC
 * is stable as long as id is unique within a (date) bucket.
 */
export interface TransactionCursor {
  date: string
  id: string
}

// ── List with cursor pagination ──────────────────────────────
export async function listTransactions(
  supabase: Client,
  userId: string,
  options: TransactionPageOptions = {},
): Promise<CursorPage<TransactionWithRelations, TransactionCursor>> {
  const limit = Math.min(options.limit ?? 50, 200)

  let query = supabase
    .from('transactions')
    .select(TRANSACTION_SELECT)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('transaction_date', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1) // fetch one extra to detect hasMore

  // ── Filters ──
  if (options.fromDate) query = query.gte('transaction_date', options.fromDate)
  if (options.toDate) query = query.lte('transaction_date', options.toDate)
  if (options.type) query = query.eq('transaction_type', options.type)
  if (options.accountId) query = query.eq('account_id', options.accountId)
  if (options.categoryId) query = query.eq('category_id', options.categoryId)
  if (options.minAmount !== undefined) query = query.gte('amount', options.minAmount)
  if (options.maxAmount !== undefined) query = query.lte('amount', options.maxAmount)
  if (options.isReconciled !== undefined) query = query.eq('is_reconciled', options.isReconciled)

  if (options.search) {
    // ILIKE on description OR notes — both are unindexed but fine for typical volumes.
    const term = `%${options.search.replace(/[%_]/g, '\\$&')}%`
    query = query.or(`description.ilike.${term},notes.ilike.${term}`)
  }

  // ── Cursor (keyset) pagination ──
  // Continue from (date < cursor.date) OR (date = cursor.date AND id < cursor.id).
  if (options.cursor) {
    const { date, id } = options.cursor
    query = query.or(
      `transaction_date.lt.${date},and(transaction_date.eq.${date},id.lt.${id})`,
    )
  }

  const rows = unwrap(await query) as unknown as TransactionWithRelations[]

  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, limit) : rows
  const last = items.at(-1)
  const nextCursor: TransactionCursor | null =
    hasMore && last ? { date: last.transaction_date, id: last.id } : null

  return { items, nextCursor, hasMore }
}

// ── Get one ──────────────────────────────────────────────────
export async function getTransaction(
  supabase: Client,
  id: string,
): Promise<TransactionWithRelations | null> {
  const result = await supabase
    .from('transactions')
    .select(TRANSACTION_SELECT)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  return unwrapMaybe(result) as unknown as TransactionWithRelations | null
}

// ── Create ───────────────────────────────────────────────────
// For transfers, two records are inserted in a single round-trip:
// the source (canonical) and the destination mirror linked via
// transfer_transaction_id. The DB trigger updates both balances.
export async function createTransaction(
  supabase: Client,
  input: TransactionInsert,
): Promise<TransactionWithRelations> {
  if (input.transaction_type === 'transfer') {
    if (!input.transfer_account_id) {
      throw new Error('transfer_account_id is required for transfer transactions')
    }

    // 1. Insert the source-side canonical record.
    const source = unwrap(
      await supabase.from('transactions').insert(input).select('id').single(),
    )

    // 2. Insert the mirror record on the destination account.
    //    The balance trigger ignores rows where transfer_transaction_id IS NOT NULL.
    await supabase
      .from('transactions')
      .insert({
        ...input,
        account_id: input.transfer_account_id,
        transfer_account_id: input.account_id,
        transfer_transaction_id: source.id,
      })
      .throwOnError()

    return (await getTransaction(supabase, source.id))!
  }

  // Plain income / expense.
  const created = unwrap(
    await supabase.from('transactions').insert(input).select('id').single(),
  )
  return (await getTransaction(supabase, created.id))!
}

// ── Update ───────────────────────────────────────────────────
export async function updateTransaction(
  supabase: Client,
  id: string,
  patch: TransactionUpdate,
): Promise<TransactionWithRelations> {
  unwrap(await supabase.from('transactions').update(patch).eq('id', id).select('id').single())
  return (await getTransaction(supabase, id))!
}

// ── Soft delete ──────────────────────────────────────────────
// Sets deleted_at = now(); the balance trigger handles the revert.
// Mirror transfer records are soft-deleted alongside their source.
export async function deleteTransaction(supabase: Client, id: string): Promise<void> {
  const now = new Date().toISOString()

  // Soft-delete the row + any mirror sharing transfer_transaction_id = id.
  unwrap(
    await supabase
      .from('transactions')
      .update({ deleted_at: now })
      .or(`id.eq.${id},transfer_transaction_id.eq.${id}`)
      .select('id'),
  )
}

// ── Bulk delete ──────────────────────────────────────────────
export async function deleteTransactions(supabase: Client, ids: string[]): Promise<number> {
  if (ids.length === 0) return 0
  const now = new Date().toISOString()
  const rows = unwrap(
    await supabase
      .from('transactions')
      .update({ deleted_at: now })
      .in('id', ids)
      .select('id'),
  )
  return rows.length
}

// ── Bulk re-categorise ───────────────────────────────────────
export async function setTransactionsCategory(
  supabase: Client,
  ids: string[],
  categoryId: string | null,
): Promise<number> {
  if (ids.length === 0) return 0
  const rows = unwrap(
    await supabase
      .from('transactions')
      .update({ category_id: categoryId })
      .in('id', ids)
      .select('id'),
  )
  return rows.length
}
