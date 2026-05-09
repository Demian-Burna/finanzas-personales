import { z } from 'zod'

export const transactionSchema = z.object({
  account_id: z.string().uuid('Cuenta inválida'),
  category_id: z.string().uuid().nullable().optional(),
  amount: z.number().positive('El monto debe ser positivo'),
  type: z.enum(['income', 'expense', 'transfer']),
  description: z.string().min(1, 'La descripción es requerida').max(255),
  notes: z.string().max(1000).nullable().optional(),
  date: z.string().datetime(),
  is_recurring: z.boolean().default(false),
})

export type TransactionInput = z.infer<typeof transactionSchema>
