import { z } from 'zod'

export const budgetSchema = z.object({
  category_id: z.string().uuid('Categoría inválida'),
  period_type: z.enum(['monthly', 'weekly', 'yearly', 'custom'], {
    message: 'Período inválido',
  }),
  amount: z.number().positive('El monto límite debe ser positivo'),
  currency_code: z.string().length(3, 'Moneda inválida (código ISO de 3 letras)'),
  start_date: z.string().min(1, 'La fecha de inicio es requerida'),
  end_date: z.string().nullable().optional(),
  rollover_unused: z.boolean().default(false),
  alert_threshold_pct: z.number().int().min(1).max(100).default(80),
})

export type BudgetInput = z.infer<typeof budgetSchema>
