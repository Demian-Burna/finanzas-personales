'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAccount, updateAccount } from '@/lib/supabase/queries/accounts'
import { createCategory, updateCategory } from '@/lib/supabase/queries/categories'
import { profileSchema } from '@/lib/validations/profile'
import { accountSchema } from '@/lib/validations/account'
import { categorySchema } from '@/lib/validations/category'

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

function firstIssue(err: { issues: Array<{ message: string }> }): string {
  return err.issues[0]?.message ?? 'Datos inválidos'
}

// â”€â”€ Profile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function updateProfileAction(raw: unknown): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }

  const supabase = await createClient()
  const { data: _authData } = await supabase.auth.getUser(); const user = _authData?.user ?? null
  if (!user) return { ok: false, error: 'No autenticado' }

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: parsed.data.display_name ?? null,
      avatar_url: parsed.data.avatar_url ?? null,
      base_currency: parsed.data.currency_code,
      locale: parsed.data.locale,
      timezone: parsed.data.timezone,
    } as never)
    .eq('id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/settings')
  revalidatePath('/')
  return { ok: true, data: undefined }
}

export async function uploadAvatarAction(formData: FormData): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient()
  const { data: _authData } = await supabase.auth.getUser(); const user = _authData?.user ?? null
  if (!user) return { ok: false, error: 'No autenticado' }

  const file = formData.get('avatar') as File | null
  if (!file || file.size === 0) return { ok: false, error: 'Archivo inválido' }
  if (file.size > 2 * 1024 * 1024) return { ok: false, error: 'El archivo no puede superar 2 MB' }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${user.id}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) return { ok: false, error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)

  await supabase.from('profiles').update({ avatar_url: publicUrl } as never).eq('id', user.id)

  revalidatePath('/settings')
  return { ok: true, data: { url: publicUrl } }
}

// â”€â”€ Accounts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function createAccountAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = accountSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }

  const supabase = await createClient()
  const { data: _authData } = await supabase.auth.getUser(); const user = _authData?.user ?? null
  if (!user) return { ok: false, error: 'No autenticado' }

  const { initial_balance = 0, include_in_net_worth, sort_order, ...rest } = parsed.data

  const { data, error } = await createAccount(supabase, {
    ...rest,
    user_id: user.id,
    initial_balance,
    current_balance: initial_balance,
    include_in_net_worth: include_in_net_worth ?? true,
    sort_order: sort_order ?? 0,
    is_active: true,
    description: rest.description ?? null,
    color: rest.color ?? null,
    icon: rest.icon ?? null,
  } as never)

  if (error || !data) return { ok: false, error: error?.message ?? 'Error al crear cuenta' }

  revalidatePath('/settings')
  revalidatePath('/')
  return { ok: true, data: { id: data.id } }
}

export async function updateAccountAction(id: string, raw: unknown): Promise<ActionResult> {
  const parsed = accountSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }

  const supabase = await createClient()
  const { include_in_net_worth, sort_order, ...rest } = parsed.data

  const { error } = await updateAccount(supabase, id, {
    ...rest,
    include_in_net_worth: include_in_net_worth ?? true,
    sort_order: sort_order ?? 0,
    description: rest.description ?? null,
    color: rest.color ?? null,
    icon: rest.icon ?? null,
  } as never)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/settings')
  revalidatePath('/')
  return { ok: true, data: undefined }
}

export async function reorderAccountsAction(orderedIds: string[]): Promise<ActionResult> {
  const supabase = await createClient()

  for (let i = 0; i < orderedIds.length; i++) {
    const id = orderedIds[i]
    if (!id) continue
    await supabase.from('accounts').update({ sort_order: i } as never).eq('id', id)
  }

  revalidatePath('/settings')
  revalidatePath('/')
  return { ok: true, data: undefined }
}

export async function archiveAccountAction(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await updateAccount(supabase, id, { is_active: false } as never)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/settings')
  revalidatePath('/')
  return { ok: true, data: undefined }
}

// â”€â”€ Categories â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function createCategoryAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = categorySchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }

  const supabase = await createClient()
  const { data: _authData } = await supabase.auth.getUser(); const user = _authData?.user ?? null
  if (!user) return { ok: false, error: 'No autenticado' }

  const { data, error } = await createCategory(supabase, {
    ...parsed.data,
    user_id: user.id,
    is_system: false,
    is_active: true,
    sort_order: parsed.data.sort_order ?? 0,
    parent_id: parsed.data.parent_id ?? null,
    color: parsed.data.color ?? null,
    icon: parsed.data.icon ?? null,
  } as never)

  if (error || !data) return { ok: false, error: error?.message ?? 'Error al crear categoría' }

  revalidatePath('/settings')
  return { ok: true, data: { id: data.id } }
}

export async function updateCategoryAction(id: string, raw: unknown): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }

  const supabase = await createClient()
  const { error } = await updateCategory(supabase, id, {
    ...parsed.data,
    sort_order: parsed.data.sort_order ?? 0,
    parent_id: parsed.data.parent_id ?? null,
    color: parsed.data.color ?? null,
    icon: parsed.data.icon ?? null,
  } as never)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/settings')
  return { ok: true, data: undefined }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('categories')
    .update({ deleted_at: new Date().toISOString(), is_active: false } as never)
    .eq('id', id)
    .eq('is_system', false)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/settings')
  return { ok: true, data: undefined }
}

// â”€â”€ Data export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function deleteAllDataAction(confirmation: string): Promise<ActionResult> {
  if (confirmation !== 'CONFIRMAR') return { ok: false, error: 'Confirmación incorrecta' }

  const supabase = await createClient()
  const { data: _authData } = await supabase.auth.getUser(); const user = _authData?.user ?? null
  if (!user) return { ok: false, error: 'No autenticado' }

  const now = new Date().toISOString()
  await Promise.all([
    supabase.from('transactions').update({ deleted_at: now } as never).eq('user_id', user.id).is('deleted_at', null),
    supabase.from('budgets').update({ deleted_at: now } as never).eq('user_id', user.id).is('deleted_at', null),
    supabase.from('recurring_items').update({ deleted_at: now } as never).eq('user_id', user.id).is('deleted_at', null),
    supabase.from('saving_goals').update({ status: 'cancelled' } as never).eq('user_id', user.id),
  ])

  revalidatePath('/')
  return { ok: true, data: undefined }
}
