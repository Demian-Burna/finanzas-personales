'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createRecurringItem,
  updateRecurringItem,
  deleteRecurringItem,
  getPendingRecurringItems,
} from '@/lib/supabase/queries/recurring-items'
import { createTransaction } from '@/lib/supabase/queries/transactions'
import { recurringItemSchema } from '@/lib/validations/recurring-item'

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

function firstIssue(err: { issues: Array<{ message: string }> }): string {
  return err.issues[0]?.message ?? 'Datos inválidos'
}

function nextOccurrence(frequency: string, fromDate: string): string {
  const d = new Date(fromDate + 'T00:00:00')
  switch (frequency) {
    case 'daily':      d.setDate(d.getDate() + 1); break
    case 'weekly':     d.setDate(d.getDate() + 7); break
    case 'biweekly':   d.setDate(d.getDate() + 14); break
    case 'monthly':    d.setMonth(d.getMonth() + 1); break
    case 'bimonthly':  d.setMonth(d.getMonth() + 2); break
    case 'quarterly':  d.setMonth(d.getMonth() + 3); break
    case 'yearly':     d.setFullYear(d.getFullYear() + 1); break
  }
  return d.toISOString().split('T')[0] ?? fromDate
}

export async function createRecurringItemAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = recurringItemSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }

  const supabase = await createClient()
  const { data: _authData } = await supabase.auth.getUser(); const user = _authData?.user ?? null
  if (!user) return { ok: false, error: 'No autenticado' }

  const { is_active, auto_create, advance_notice_days, ...rest } = parsed.data

  const { data, error } = await createRecurringItem(supabase, {
    ...rest,
    user_id: user.id,
    is_active: is_active ?? true,
    auto_create: auto_create ?? false,
    advance_notice_days: advance_notice_days ?? 3,
    next_occurrence_date: rest.start_date,
    end_date: rest.end_date ?? null,
    notes: rest.notes ?? null,
    category_id: rest.category_id ?? null,
    day_of_month: rest.day_of_month ?? null,
    day_of_week: rest.day_of_week ?? null,
  } as never)

  if (error || !data) return { ok: false, error: error?.message ?? 'Error al crear' }

  revalidatePath('/recurring')
  return { ok: true, data: { id: data.id } }
}

export async function updateRecurringItemAction(id: string, raw: unknown): Promise<ActionResult> {
  const parsed = recurringItemSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }

  const supabase = await createClient()
  const { is_active, auto_create, advance_notice_days, ...rest } = parsed.data

  const { error } = await updateRecurringItem(supabase, id, {
    ...rest,
    is_active: is_active ?? true,
    auto_create: auto_create ?? false,
    advance_notice_days: advance_notice_days ?? 3,
    end_date: rest.end_date ?? null,
    notes: rest.notes ?? null,
    category_id: rest.category_id ?? null,
    day_of_month: rest.day_of_month ?? null,
    day_of_week: rest.day_of_week ?? null,
  } as never)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/recurring')
  return { ok: true, data: undefined }
}

export async function toggleRecurringItemAction(id: string, isActive: boolean): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await updateRecurringItem(supabase, id, { is_active: isActive } as never)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/recurring')
  return { ok: true, data: undefined }
}

export async function deleteRecurringItemAction(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await deleteRecurringItem(supabase, id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/recurring')
  return { ok: true, data: undefined }
}

/**
 * Manually register a payment for a recurring item right now (user paid early).
 * Creates the transaction for today and advances next_occurrence_date to the
 * following period so it won't be charged again on the scheduled date.
 */
export async function registerRecurringNowAction(
  id: string,
  date?: string,
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()
  const { data: _authData } = await supabase.auth.getUser()
  const user = _authData?.user ?? null
  if (!user) return { ok: false, error: 'No autenticado' }

  // Fetch the recurring item
  const { data: itemRaw, error: fetchErr } = await supabase
    .from('recurring_items')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchErr || !itemRaw) return { ok: false, error: 'Recurrente no encontrado' }

  const item = itemRaw as {
    id: string; user_id: string; account_id: string; category_id: string | null
    currency_code: string; amount: number; transaction_type: string
    description: string; notes: string | null; frequency: string
    next_occurrence_date: string | null; end_date: string | null
  }

  const today = date ?? new Date().toISOString().split('T')[0] ?? ''

  // Create the transaction for today
  const { data: tx, error: txErr } = await createTransaction(supabase, {
    user_id: user.id,
    account_id: item.account_id,
    category_id: item.category_id,
    transfer_account_id: null,
    transfer_transaction_id: null,
    currency_code: item.currency_code,
    amount: item.amount,
    amount_in_base_currency: item.amount,
    exchange_rate: 1,
    transaction_type: item.transaction_type,
    description: item.description,
    notes: item.notes,
    transaction_date: today,
    value_date: null,
    is_reconciled: true, // manually registered = reconciled
    recurring_item_id: item.id,
    attachment_url: null,
  } as never)

  if (txErr || !tx) return { ok: false, error: txErr?.message ?? 'Error al crear la transacción' }

  // Advance next_occurrence_date to the next period (prevents auto-debit on original date)
  const fromDate = item.next_occurrence_date ?? today
  const next = nextOccurrence(item.frequency, fromDate)
  const shouldStop = item.end_date && next > item.end_date

  await updateRecurringItem(supabase, id, {
    next_occurrence_date: next,
    is_active: !shouldStop,
  } as never)

  revalidatePath('/')
  revalidatePath('/recurring')
  revalidatePath('/transactions')
  return { ok: true, data: { id: tx.id } }
}

// Called by Vercel cron — processes all pending auto_create items
export async function processRecurringItemsAction(): Promise<ActionResult<{ processed: number; errors: number }>> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0] ?? ''

  const { data: _authData } = await supabase.auth.getUser(); const user = _authData?.user ?? null
  if (!user) return { ok: false, error: 'No autenticado' }

  const { data: items, error: fetchError } = await getPendingRecurringItems(supabase, today)
  if (fetchError) return { ok: false, error: fetchError.message }

  let processed = 0
  let errors = 0

  for (const item of items) {
    const { error: txError } = await createTransaction(supabase, {
      user_id: item.user_id,
      account_id: item.account_id,
      category_id: item.category_id,
      transfer_account_id: null,
      transfer_transaction_id: null,
      currency_code: item.currency_code,
      amount: item.amount,
      amount_in_base_currency: item.amount,
      exchange_rate: 1,
      transaction_type: item.transaction_type,
      description: item.description,
      notes: item.notes,
      transaction_date: item.next_occurrence_date ?? today,
      value_date: null,
      is_reconciled: false,
      recurring_item_id: item.id,
      attachment_url: null,
    } as never)

    if (txError) { errors++; continue }

    const next = nextOccurrence(item.frequency, item.next_occurrence_date ?? today)
    const shouldStop = item.end_date && next > item.end_date

    await updateRecurringItem(supabase, item.id, {
      next_occurrence_date: next,
      is_active: !shouldStop,
    } as never)

    processed++
  }

  revalidatePath('/')
  revalidatePath('/recurring')
  return { ok: true, data: { processed, errors } }
}
