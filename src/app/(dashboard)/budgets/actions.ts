'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createBudget, updateBudget, deleteBudget } from '@/lib/supabase/queries/budgets'
import { budgetSchema } from '@/lib/validations/budget'

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

function firstIssue(err: { issues: Array<{ message: string }> }): string {
  return err.issues[0]?.message ?? 'Datos inválidos'
}

export async function createBudgetAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = budgetSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'No autenticado' }

  const { rollover_unused, alert_threshold_pct, ...rest } = parsed.data

  const { data, error } = await createBudget(supabase, {
    ...rest,
    rollover_unused: rollover_unused ?? false,
    alert_threshold_pct: alert_threshold_pct ?? 80,
    user_id: user.id,
    is_active: true,
    end_date: rest.end_date ?? null,
  } as never)

  if (error || !data) return { ok: false, error: error?.message ?? 'Error al crear presupuesto' }

  revalidatePath('/budgets')
  revalidatePath('/')
  return { ok: true, data: { id: data.id } }
}

export async function updateBudgetAction(id: string, raw: unknown): Promise<ActionResult> {
  const parsed = budgetSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }

  const supabase = await createClient()
  const { rollover_unused, alert_threshold_pct, ...rest } = parsed.data

  const { error } = await updateBudget(supabase, id, {
    ...rest,
    rollover_unused: rollover_unused ?? false,
    alert_threshold_pct: alert_threshold_pct ?? 80,
    end_date: rest.end_date ?? null,
  } as never)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/budgets')
  revalidatePath('/')
  return { ok: true, data: undefined }
}

export async function toggleBudgetActiveAction(id: string, isActive: boolean): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await updateBudget(supabase, id, { is_active: isActive } as never)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/budgets')
  return { ok: true, data: undefined }
}

export async function deleteBudgetAction(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await deleteBudget(supabase, id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/budgets')
  revalidatePath('/')
  return { ok: true, data: undefined }
}
