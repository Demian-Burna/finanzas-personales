import { z } from 'zod'

// Reusable primitives.
const isoDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)')

const positiveAmount = z
  .number()
  .finite()
  .positive('El monto debe ser positivo')
  .max(1_000_000_000_000, 'El monto excede el máximo permitido')

const currencyCode = z
  .string()
  .length(3, 'Código de moneda ISO 4217 (3 caracteres)')
  .toUpperCase()

const transactionType = z.enum(['income', 'expense', 'transfer'], {
  message: 'Tipo de transacción inválido',
})

// ── Base shape (without transfer-specific rules) ────────────
const transactionBase = z.object({
  account_id: z.string().uuid('Cuenta inválida'),
  category_id: z.string().uuid('Categoría inválida').nullable().optional(),
  transfer_account_id: z.string().uuid('Cuenta destino inválida').nullable().optional(),
  currency_code: currencyCode,
  amount: positiveAmount,
  exchange_rate: z.number().positive().default(1),
  transaction_type: transactionType,
  description: z.string().max(500, 'Máximo 500 caracteres').nullable().optional(),
  notes: z.string().max(2000, 'Máximo 2000 caracteres').nullable().optional(),
  transaction_date: isoDateString,
  value_date: isoDateString.nullable().optional(),
  is_reconciled: z.boolean().default(false),
  recurring_item_id: z.string().uuid().nullable().optional(),
  attachment_url: z.string().url('URL inválida').nullable().optional(),
})

// ── Refinement: transfers require a distinct destination account ─
export const transactionSchema = transactionBase.superRefine((val, ctx) => {
  if (val.transaction_type === 'transfer') {
    if (!val.transfer_account_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['transfer_account_id'],
        message: 'Las transferencias requieren cuenta destino',
      })
    } else if (val.transfer_account_id === val.account_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['transfer_account_id'],
        message: 'La cuenta destino debe ser distinta a la de origen',
      })
    }
  } else if (!val.category_id) {
    // income / expense need a category for reporting.
    ctx.addIssue({
      code: 'custom',
      path: ['category_id'],
      message: 'Seleccioná una categoría',
    })
  }
})

export type TransactionFormInput = z.infer<typeof transactionSchema>

// ── Update schema ────────────────────────────────────────────
// All optional; same rules apply when fields are present.
export const transactionUpdateSchema = transactionBase.partial()
export type TransactionUpdateInput = z.infer<typeof transactionUpdateSchema>

// ── List filters ─────────────────────────────────────────────
export const transactionFilterSchema = z.object({
  fromDate: isoDateString.optional(),
  toDate: isoDateString.optional(),
  type: transactionType.optional(),
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  search: z.string().max(120).optional(),
  minAmount: z.number().nonnegative().optional(),
  maxAmount: z.number().nonnegative().optional(),
  isReconciled: z.boolean().optional(),
})
export type TransactionFilterInput = z.infer<typeof transactionFilterSchema>
