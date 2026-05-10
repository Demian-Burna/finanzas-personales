'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createSavingGoal,
  updateSavingGoal,
  addGoalContribution,
} from '@/lib/supabase/queries/saving-goals'
import { savingGoalSchema, goalContributionSchema } from '@/lib/validations/saving-goal'
import { createTransaction } from '@/lib/supabase/queries/transactions'

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

function firstIssue(err: { issues: Array<{ message: string }> }): string {
  return err.issues[0]?.message ?? 'Datos inválidos'
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

/**
 * Creates an expense transaction linked to a goal contribution.
 * Bypasses the form schema (no category required for internal goal transactions).
 */
export async function createGoalTransactionAction(input: {
  account_id: string
  currency_code: string
  amount: number
  description: string
  transaction_date: string
  note: string | null
}): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()
  const { data: _authData } = await supabase.auth.getUser()
  const user = _authData?.user ?? null
  if (!user) return { ok: false, error: 'No autenticado' }

  const { data, error } = await createTransaction(supabase, {
    user_id: user.id,
    account_id: input.account_id,
    category_id: null,
    transfer_account_id: null,
    transfer_transaction_id: null,
    currency_code: input.currency_code,
    amount: input.amount,
    amount_in_base_currency: input.amount,
    exchange_rate: 1,
    transaction_type: 'expense',
    description: input.description,
    notes: input.note,
    transaction_date: input.transaction_date,
    value_date: null,
    is_reconciled: false,
    recurring_item_id: null,
    attachment_url: null,
  } as never)

  if (error || !data) return { ok: false, error: error?.message ?? 'Error al crear transacción' }

  revalidatePath('/transactions')
  revalidatePath('/')
  return { ok: true, data: { id: data.id } }
}

export async function updateGoalStatusAction(id: string, status: 'active' | 'paused' | 'cancelled'): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await updateSavingGoal(supabase, id, { status } as never)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/goals')
  return { ok: true, data: undefined }
}
