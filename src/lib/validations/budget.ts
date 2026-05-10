import { z } from 'zod'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)')

export const budgetSchema = z
  .object({
    category_id: z.string().uuid('Seleccioná una categoría'),
    period_type: z.enum(['monthly', 'weekly', 'yearly', 'custom']),
    amount: z
      .number()
      .finite()
      .positive('El monto debe ser positivo')
      .max(1_000_000_000_000),
    currency_code: z.string().length(3).toUpperCase(),
    start_date: isoDate,
    end_date: isoDate.nullable().optional(),
    rollover_unused: z.boolean().default(false),
    alert_threshold_pct: z
      .number()
      .int()
      .min(1, 'Mínimo 1%')
      .max(100, 'Máximo 100%')
      .default(80),
    is_active: z.boolean().default(true),
  })
  .refine((val) => !val.end_date || val.end_date >= val.start_date, {
    path: ['end_date'],
    message: 'La fecha de fin debe ser igual o posterior al inicio',
  })

export type BudgetFormInput = z.infer<typeof budgetSchema>

// Update needs a separate, shape-only partial because Zod doesn't carry
// over the cross-field refinement; we keep it simpler on edit.
export const budgetUpdateSchema = z.object({
  category_id: z.string().uuid().optional(),
  period_type: z.enum(['monthly', 'weekly', 'yearly', 'custom']).optional(),
  amount: z.number().finite().positive().max(1_000_000_000_000).optional(),
  currency_code: z.string().length(3).toUpperCase().optional(),
  start_date: isoDate.optional(),
  end_date: isoDate.nullable().optional(),
  rollover_unused: z.boolean().optional(),
  alert_threshold_pct: z.number().int().min(1).max(100).optional(),
  is_active: z.boolean().optional(),
})
export type BudgetUpdateInput = z.infer<typeof budgetUpdateSchema>
