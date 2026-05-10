import { z } from 'zod'

export const transactionSchema = z
  .object({
    transaction_type: z.enum(['income', 'expense', 'transfer'], {
      message: 'Tipo de transacción inválido',
    }),
    account_id: z.string().min(1, 'Seleccioná una cuenta'),
    // Permissive — presence validated in superRefine to avoid "Invalid input" from uuid()
    transfer_account_id: z.string().nullable().optional(),
    category_id: z.string().nullable().optional(),
    currency_code: z.string().min(3).max(3),
    exchange_rate: z.coerce.number().positive().default(1),
    exchange_rate_type: z.string().optional(),
    amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
    description: z.string().min(1, 'La descripción es requerida').max(255),
    notes: z.string().max(1000).nullable().optional(),
    transaction_date: z.string().min(1, 'La fecha es requerida'),
    is_reconciled: z.boolean(),
  })
  .superRefine((val, ctx) => {
    if (val.transaction_type === 'transfer' && (!val.transfer_account_id || val.transfer_account_id === '')) {
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
export type TransactionInput = TransactionFormValues
