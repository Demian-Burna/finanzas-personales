'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createSavingGoal,
  updateSavingGoal,
  addGoalContribution,
} from '@/lib/supabase/queries/saving-goals'
import { savingGoalSchema, goalContributionSchema } from '@/lib/validations/saving-goal'

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

function firstIssue(err: { issues: Array<{ message: string }> }): string {
  return err.issues[0]?.message ?? 'Datos invÃ¡lidos'
}

export async function createGoalAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = savingGoalSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }

  const supabase = await createClient()
  const { data: _authData } = await supabase.auth.getUser(); const user = _authData?.user ?? null
  if (!user) return { ok: false, error: 'No autenticado' }

  const { data, error } = await createSavingGoal(supabase, {
    ...parsed.data,
    user_id: user.id,
    current_amount: 0,
    status: 'active',
    account_id: parsed.data.account_id ?? null,
    description: parsed.data.description ?? null,
    target_date: parsed.data.target_date ?? null,
    color: parsed.data.color ?? null,
    icon: parsed.data.icon ?? null,
  } as never)

  if (error || !data) return { ok: false, error: error?.message ?? 'Error al crear meta' }

  revalidatePath('/goals')
  return { ok: true, data: { id: data.id } }
}

export async function updateGoalAction(id: string, raw: unknown): Promise<ActionResult> {
  const parsed = savingGoalSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }

  const supabase = await createClient()
  const { error } = await updateSavingGoal(supabase, id, {
    ...parsed.data,
    account_id: parsed.data.account_id ?? null,
    description: parsed.data.description ?? null,
    target_date: parsed.data.target_date ?? null,
    color: parsed.data.color ?? null,
    icon: parsed.data.icon ?? null,
  } as never)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/goals')
  return { ok: true, data: undefined }
}

export async function addContributionAction(raw: unknown): Promise<ActionResult> {
  const parsed = goalContributionSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }

  const supabase = await createClient()
  const { data: _authData } = await supabase.auth.getUser(); const user = _authData?.user ?? null
  if (!user) return { ok: false, error: 'No autenticado' }

  // Insert contribution
  const { error: contribError } = await addGoalContribution(supabase, {
    ...parsed.data,
    transaction_id: parsed.data.transaction_id ?? null,
    note: parsed.data.note ?? null,
  } as never)
  if (contribError) return { ok: false, error: contribError.message }

  // Update current_amount on saving_goals
  const { data: goalRaw } = await supabase
    .from('saving_goals')
    .select('current_amount,target_amount')
    .eq('id', parsed.data.goal_id)
    .single()

  const goal = goalRaw as { current_amount: number; target_amount: number } | null
  if (goal) {
    const newAmount = goal.current_amount + parsed.data.amount
    const newStatus = newAmount >= goal.target_amount ? 'completed' : 'active'
    await updateSavingGoal(supabase, parsed.data.goal_id, {
      current_amount: newAmount,
      status: newStatus,
    } as never)
  }

  revalidatePath('/goals')
  return { ok: true, data: undefined }
}

export async function updateGoalStatusAction(id: string, status: 'active' | 'paused' | 'cancelled'): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await updateSavingGoal(supabase, id, { status } as never)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/goals')
  return { ok: true, data: undefined }
}
