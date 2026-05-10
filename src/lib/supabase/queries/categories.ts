// ============================================================
// Categories — list (system + user), CRUD on user-owned
// ============================================================
// System categories are read-only (user_id IS NULL, is_system=true).
// RLS enforces this; the queries simply filter.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type {
  CategoryInsert,
  CategoryRow,
  CategoryUpdate,
  TransactionType,
} from '@/types/domain'
import { unwrap, unwrapMaybe } from '../error'

type Client = SupabaseClient<Database>

const CATEGORY_SELECT = `
  id,
  user_id,
  parent_id,
  name,
  color,
  icon,
  transaction_type,
  is_system,
  is_active,
  sort_order,
  deleted_at,
  created_at,
  updated_at
` as const

// ── List ─────────────────────────────────────────────────────
export interface CategoryListOptions {
  /** Filter to a single transaction kind. */
  type?: TransactionType
  /** Default true. */
  includeSystem?: boolean
  /** Default true. */
  activeOnly?: boolean
}

export async function listCategories(
  supabase: Client,
  userId: string,
  options: CategoryListOptions = {},
): Promise<CategoryRow[]> {
  const includeSystem = options.includeSystem ?? true
  const activeOnly = options.activeOnly ?? true

  let query = supabase
    .from('categories')
    .select(CATEGORY_SELECT)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  // RLS already restricts to (user_id IS NULL OR user_id = auth.uid())
  // but we add a filter so the local "include system" toggle works.
  if (includeSystem) {
    query = query.or(`user_id.is.null,user_id.eq.${userId}`)
  } else {
    query = query.eq('user_id', userId)
  }

  if (options.type) query = query.eq('transaction_type', options.type)
  if (activeOnly) query = query.eq('is_active', true)

  return unwrap(await query) as unknown as CategoryRow[]
}

// ── Tree-shaped helper ───────────────────────────────────────
// Returns roots with their children attached. Stable on input order.
export interface CategoryNode extends CategoryRow {
  children: CategoryRow[]
}

export async function listCategoryTree(
  supabase: Client,
  userId: string,
  options: CategoryListOptions = {},
): Promise<CategoryNode[]> {
  const flat = await listCategories(supabase, userId, options)
  const byParent = new Map<string | null, CategoryRow[]>()

  for (const cat of flat) {
    const arr = byParent.get(cat.parent_id) ?? []
    arr.push(cat)
    byParent.set(cat.parent_id, arr)
  }

  return (byParent.get(null) ?? []).map((root) => ({
    ...root,
    children: byParent.get(root.id) ?? [],
  }))
}

// ── Get one ──────────────────────────────────────────────────
export async function getCategory(
  supabase: Client,
  id: string,
): Promise<CategoryRow | null> {
  const result = await supabase
    .from('categories')
    .select(CATEGORY_SELECT)
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  return unwrapMaybe(result) as unknown as CategoryRow | null
}

// ── Create ───────────────────────────────────────────────────
export async function createCategory(
  supabase: Client,
  input: CategoryInsert,
): Promise<CategoryRow> {
  // Force is_system=false for user-created rows; RLS would reject otherwise.
  const safe: CategoryInsert = { ...input, is_system: false }
  const created = unwrap(
    await supabase
      .from('categories')
      .insert(safe)
      .select(CATEGORY_SELECT)
      .single(),
  )
  return created as unknown as CategoryRow
}

// ── Update ───────────────────────────────────────────────────
export async function updateCategory(
  supabase: Client,
  id: string,
  patch: CategoryUpdate,
): Promise<CategoryRow> {
  // Don't allow toggling is_system from the client; RLS would reject anyway.
  const safe: CategoryUpdate = { ...patch }
  delete (safe as { is_system?: boolean }).is_system

  const updated = unwrap(
    await supabase
      .from('categories')
      .update(safe)
      .eq('id', id)
      .select(CATEGORY_SELECT)
      .single(),
  )
  return updated as unknown as CategoryRow
}

// ── Archive (soft delete) ────────────────────────────────────
export async function archiveCategory(supabase: Client, id: string): Promise<void> {
  unwrap(
    await supabase
      .from('categories')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', id)
      .select('id'),
  )
}

// ── Reorder ──────────────────────────────────────────────────
export async function reorderCategories(
  supabase: Client,
  ids: string[],
): Promise<void> {
  await Promise.all(
    ids.map((id, idx) =>
      supabase.from('categories').update({ sort_order: idx }).eq('id', id).throwOnError(),
    ),
  )
}
