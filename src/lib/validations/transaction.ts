import { z } from 'zod'

export const transactionSchema = z
  .object({
    transaction_type: z.enum(['income', 'expense', 'transfer'], {
      message: 'Tipo de transacción inválido',
    }),
    account_id: z.string().uuid('Seleccioná una cuenta'),
    // Allow '' (empty string from base-ui Select) in addition to null/uuid
    transfer_account_id: z.union([z.string().uuid(), z.literal(''), z.null()]).optional(),
    category_id: z.union([z.string().uuid(), z.literal(''), z.null()]).optional(),
    currency_code: z.string().min(3).max(3),
    // z.coerce.number() handles string→number from HTML inputs (valueAsNumber quirks)
    amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
    description: z.string().min(1, 'La descripción es requerida').max(255),
    notes: z.string().max(1000).nullable().optional(),
    transaction_date: z.string().min(1, 'La fecha es requerida'),
    is_reconciled: z.boolean(),
  })
  .superRefine((val, ctx) => {
    if (val.transaction_type === 'transfer' && !val.transfer_account_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Seleccioná una cuenta destino',
        path: ['transfer_account_id'],
      })
    }
    if (val.transaction_type !== 'transfer' && (!val.category_id || val.category_id === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Seleccioná una categoría',
        path: ['category_id'],
      })
    }
  })

export type TransactionFormValues = z.infer<typeof transactionSchema>
// Backwards-compat alias
export type TransactionInput = TransactionFormValues
