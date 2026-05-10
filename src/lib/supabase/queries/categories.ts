import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { CategoryRow, CategoryInsert, CategoryUpdate } from '@/types/domain'

type Client = SupabaseClient<Database>

export interface CategoryWithParent extends CategoryRow {
  parent: { id: string; name: string } | null
}

const CATEGORY_COLUMNS = [
  'id', 'user_id', 'parent_id', 'name', 'color', 'icon',
  'transaction_type', 'is_system', 'is_active', 'sort_order',
  'deleted_at', 'created_at', 'updated_at',
  // Self-referential FK — cast to CategoryWithParent at call sites
  'parent:categories!parent_id(id,name)',
].join(',')

export async function getCategories(
  client: Client,
  options: {
    type?: 'income' | 'expense' | 'transfer'
    includeSystem?: boolean
  } = {},
): Promise<{ data: CategoryWithParent[]; error: PostgrestError | null }> {
  const { type, includeSystem = true } = options

  let query = client
    .from('categories')
    .select(CATEGORY_COLUMNS)
    .is('deleted_at', null)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (type)            query = query.eq('transaction_type', type)
  if (!includeSystem)  query = query.eq('is_system', false)

  const { data, error } = await query

  return {
    data: (data as unknown as CategoryWithParent[]) ?? [],
    error,
  }
}

export async function getCategoryById(
  client: Client,
  id: string,
): Promise<{ data: CategoryWithParent | null; error: PostgrestError | null }> {
  const { data, error } = await client
    .from('categories')
    .select(CATEGORY_COLUMNS)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  return { data: data as unknown as CategoryWithParent | null, error }
}

// supabase-js cannot resolve Insert/Update types when defined as Omit<Row, ...>
// in the Database interface (circular self-reference during type evaluation).
// Using `as never` is intentional — the function signatures still enforce types for callers.
export async function createCategory(
  client: Client,
  input: CategoryInsert,
): Promise<{ data: CategoryRow | null; error: PostgrestError | null }> {
  const { data, error } = await client
    .from('categories')
    .insert(input as never)
    .select('id,user_id,parent_id,name,color,icon,transaction_type,is_system,is_active,sort_order,created_at,updated_at')
    .single()

  return { data, error }
}

export async function updateCategory(
  client: Client,
  id: string,
  input: CategoryUpdate,
): Promise<{ data: CategoryRow | null; error: PostgrestError | null }> {
  const { data, error } = await client
    .from('categories')
    .update(input as never)
    .eq('id', id)
    .is('deleted_at', null)
    .select('id,user_id,parent_id,name,color,icon,transaction_type,is_system,is_active,sort_order,created_at,updated_at')
    .single()

  return { data, error }
}
