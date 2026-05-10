'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createTransaction } from '@/lib/supabase/queries/transactions'
import type { ActionResult } from '../actions'

type ColumnKey = 'date' | 'description' | 'amount' | 'type' | 'skip'

function detectSeparator(line: string): string {
  const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0 }
  for (const ch of line) {
    if (ch in counts) counts[ch] = (counts[ch] ?? 0) + 1
  }
  return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? ','
}

function parseDate(raw: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw

  const dmy = raw.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})$/)
  if (dmy) {
    const [, d, m, y] = dmy
    const year = y && y.length === 2 ? `20${y}` : y
    return `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }
  return null
}

export async function importCsvAction(
  formData: FormData,
): Promise<ActionResult<{ imported: number; errors: number }>> {
  const csv = formData.get('csv') as string | null
  const accountId = formData.get('accountId') as string | null
  const mappingRaw = formData.get('mapping') as string | null

  if (!csv || !accountId || !mappingRaw) {
    return { ok: false, error: 'Datos incompletos' }
  }

  const mapping = JSON.parse(mappingRaw) as Record<string, ColumnKey>

  const supabase = await createClient()
  const { data: _authData } = await supabase.auth.getUser(); const user = _authData?.user ?? null
  if (!user) return { ok: false, error: 'No autenticado' }

  const { data: profileRaw } = await supabase.from('profiles').select('base_currency').single()
  const profile = profileRaw as { base_currency: string | null } | null
  const currency = profile?.base_currency ?? 'ARS'

  const lines = csv.split(/\r?\n/).filter((l) => l.trim())
  const sep = detectSeparator(lines[0] ?? '')
  const dataRows = lines.slice(1)

  let imported = 0
  let errors = 0

  for (const line of dataRows) {
    if (!line.trim()) continue
    const cells = line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ''))

    let date: string | null = null
    let description = ''
    let amount: number | null = null
    let txType: 'income' | 'expense' = 'expense'

    for (const [idxStr, role] of Object.entries(mapping)) {
      const idx = Number(idxStr)
      const val = cells[idx] ?? ''

      if (role === 'date') date = parseDate(val)
      else if (role === 'description') description = val
      else if (role === 'amount') {
        const n = parseFloat(val.replace(/[^\d.,-]/g, '').replace(',', '.'))
        if (!isNaN(n)) amount = Math.abs(n)
        if (n < 0) txType = 'expense'
      } else if (role === 'type') {
        const lower = val.toLowerCase()
        if (lower.includes('income') || lower.includes('ingreso') || lower.includes('credit')) txType = 'income'
      }
    }

    if (!date || amount === null || !description) {
      errors++
      continue
    }

    const { error } = await createTransaction(supabase, {
      user_id: user.id,
      account_id: accountId,
      category_id: null,
      transfer_account_id: null,
      transfer_transaction_id: null,
      currency_code: currency,
      amount,
      amount_in_base_currency: amount,
      exchange_rate: 1,
      transaction_type: txType,
      description,
      notes: null,
      transaction_date: date,
      value_date: null,
      is_reconciled: false,
      recurring_item_id: null,
      attachment_url: null,
    } as never)

    if (error) errors++
    else imported++
  }

  revalidatePath('/')
  revalidatePath('/transactions')
  return { ok: true, data: { imported, errors } }
}
