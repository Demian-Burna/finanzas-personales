// ============================================================
// Accounts — list, fetch, mutate, archive
// ============================================================
// `current_balance` is denormalized and kept in sync by the
// update_account_balance() DB trigger, so reads are O(1).
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { AccountInsert, AccountUpdate, AccountWithType } from '@/types/domain'
import { unwrap, unwrapMaybe } from '../error'

type Client = SupabaseClient<Database>

const ACCOUNT_SELECT = `
  id,
  user_id,
  account_type_id,
  currency_code,
  name,
  description,
  initial_balance,
  current_balance,
  color,
  icon,
  is_active,
  include_in_net_worth,
  sort_order,
  deleted_at,
  created_at,
  updated_at,
  account_type:account_types!accounts_account_type_id_fkey (
    id, name, nature, icon, sort_order
  )
` as const

// ── List ─────────────────────────────────────────────────────
export interface AccountListOptions {
  /** Default true. */
  activeOnly?: boolean
  /** Default true. */
  includeBalances?: boolean
}

export async function listAccounts(
  supabase: Client,
  userId: string,
  options: AccountListOptions = {},
): Promise<AccountWithType[]> {
  const activeOnly = options.activeOnly ?? true

  let query = supabase
    .from('accounts')
    .select(ACCOUNT_SELECT)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (activeOnly) query = query.eq('is_active', true)

  return unwrap(await query) as unknown as AccountWithType[]
}

// ── Get one ──────────────────────────────────────────────────
export async function getAccount(
  supabase: Client,
  id: string,
): Promise<AccountWithType | null> {
  const result = await supabase
    .from('accounts')
    .select(ACCOUNT_SELECT)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  return unwrapMaybe(result) as unknown as AccountWithType | null
}

// ── Create ───────────────────────────────────────────────────
// We seed current_balance with initial_balance so the dashboard
// reflects it before any transaction runs through the trigger.
export async function createAccount(
  supabase: Client,
  input: AccountInsert,
): Promise<AccountWithType> {
  const payload: AccountInsert = {
    ...input,
    current_balance: input.current_balance ?? input.initial_balance ?? 0,
  }

  const created = unwrap(
    await supabase.from('accounts').insert(payload).select('id').single(),
  )
  return (await getAccount(supabase, created.id))!
}

// ── Update ───────────────────────────────────────────────────
export async function updateAccount(
  supabase: Client,
  id: string,
  patch: AccountUpdate,
): Promise<AccountWithType> {
  unwrap(await supabase.from('accounts').update(patch).eq('id', id).select('id').single())
  return (await getAccount(supabase, id))!
}

// ── Archive (soft delete) ────────────────────────────────────
export async function archiveAccount(supabase: Client, id: string): Promise<void> {
  unwrap(
    await supabase
      .from('accounts')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', id)
      .select('id'),
  )
}

// ── Reorder ──────────────────────────────────────────────────
// Assigns sequential sort_order values from the input list order.
// Useful for drag-and-drop in settings.
export async function reorderAccounts(
  supabase: Client,
  ids: string[],
): Promise<void> {
  await Promise.all(
    ids.map((id, idx) =>
      supabase.from('accounts').update({ sort_order: idx }).eq('id', id).throwOnError(),
    ),
  )
}

// ── Net worth (total balance across asset/liability accounts) ─
export interface NetWorth {
  total: number
  assets: number
  liabilities: number
  by_currency: Record<string, number>
}

export async function getNetWorth(supabase: Client, userId: string): Promise<NetWorth> {
  const accounts = await listAccounts(supabase, userId, { activeOnly: true })

  return accounts
    .filter((a) => a.include_in_net_worth)
    .reduce<NetWorth>(
      (acc, account) => {
        const sign = account.account_type.nature === 'asset' ? 1 : -1
        const signed = Number(account.current_balance) * sign
        acc.total += signed
        if (sign === 1) acc.assets += Number(account.current_balance)
        else acc.liabilities += Number(account.current_balance)
        acc.by_currency[account.currency_code] =
          (acc.by_currency[account.currency_code] ?? 0) + signed
        return acc
      },
      { total: 0, assets: 0, liabilities: 0, by_currency: {} },
    )
}
