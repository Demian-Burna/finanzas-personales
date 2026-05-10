'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionById,
} from '@/lib/supabase/queries/transactions'
import { transactionSchema } from '@/lib/validations/transaction'

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

function firstError(err: { issues: Array<{ message: string }> }): string {
  return err.issues[0]?.message ?? 'Datos inválidos'
}

export async function createTransactionAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = transactionSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) }

  const supabase = await createClient()
  const { data: _authData } = await supabase.auth.getUser(); const user = _authData?.user ?? null
  if (!user) return { ok: false, error: 'No autenticado' }

  const { transaction_type, transfer_account_id, ...rest } = parsed.data

  const { data, error } = await createTransaction(supabase, {
    ...rest,
    transaction_type,
    user_id: user.id,
    transfer_account_id: transaction_type === 'transfer' ? (transfer_account_id ?? null) : null,
    category_id: transaction_type === 'transfer' ? null : (rest.category_id ?? null),
    amount_in_base_currency: rest.amount,
    transfer_transaction_id: null,
    exchange_rate: null,
    value_date: null,
    recurring_item_id: null,
    attachment_url: null,
    notes: rest.notes ?? null,
  } as never)

  if (error || !data) return { ok: false, error: error?.message ?? 'Error al crear transacción' }

  revalidatePath('/')
  revalidatePath('/transactions')
  return { ok: true, data: { id: data.id } }
}

export async function updateTransactionAction(
  id: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = transactionSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) }

  const supabase = await createClient()
  const { transaction_type, transfer_account_id, ...rest } = parsed.data

  const { error } = await updateTransaction(supabase, id, {
    ...rest,
    transaction_type,
    transfer_account_id: transaction_type === 'transfer' ? (transfer_account_id ?? null) : null,
    category_id: transaction_type === 'transfer' ? null : (rest.category_id ?? null),
    amount_in_base_currency: rest.amount,
    notes: rest.notes ?? null,
  } as never)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/')
  revalidatePath('/transactions')
  return { ok: true, data: undefined }
}

export async function deleteTransactionAction(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await deleteTransaction(supabase, id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/')
  revalidatePath('/transactions')
  return { ok: true, data: undefined }
}

export async function duplicateTransactionAction(id: string): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()
  const { data: _authData } = await supabase.auth.getUser(); const user = _authData?.user ?? null
  if (!user) return { ok: false, error: 'No autenticado' }

  const { data: original } = await getTransactionById(supabase, id)
  if (!original) return { ok: false, error: 'Transacción no encontrada' }

  const today = new Date().toISOString().split('T')[0] ?? original.transaction_date

  const { data, error } = await createTransaction(supabase, {
    user_id: user.id,
    account_id: original.account_id,
    category_id: original.category_id,
    transfer_account_id: original.transfer_account_id,
    transfer_transaction_id: null,
    currency_code: original.currency_code,
    amount: original.amount,
    amount_in_base_currency: original.amount_in_base_currency,
    exchange_rate: null,
    transaction_type: original.transaction_type,
    description: original.description,
    notes: original.notes,
    transaction_date: today,
    value_date: null,
    is_reconciled: false,
    recurring_item_id: null,
    attachment_url: null,
  } as never)

  if (error || !data) return { ok: false, error: error?.message ?? 'Error al duplicar' }

  revalidatePath('/transactions')
  return { ok: true, data: { id: data.id } }
}

export async function bulkDeleteTransactionsAction(ids: string[]): Promise<ActionResult> {
  if (!ids.length) return { ok: true, data: undefined }

  const supabase = await createClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('transactions')
    .update({ deleted_at: now } as never)
    .in('id', ids)
    .is('deleted_at', null)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/')
  revalidatePath('/transactions')
  return { ok: true, data: undefined }
}
