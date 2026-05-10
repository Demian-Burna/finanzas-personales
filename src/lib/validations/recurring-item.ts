import { z } from 'zod'

export const recurringItemSchema = z.object({
  account_id: z.string().min(1, 'Seleccioná una cuenta'),
  category_id: z.string().uuid().nullable().optional(),
  currency_code: z.string().length(3, 'Moneda inválida (código ISO de 3 letras)'),
  amount: z.number().positive('El monto debe ser positivo'),
  transaction_type: z.enum(['income', 'expense', 'transfer'], {
    message: 'Tipo de transacción inválido',
  }),
  description: z
    .string()
    .min(1, 'La descripción es requerida')
    .max(255, 'La descripción no puede superar 255 caracteres'),
  notes: z.string().max(1000).nullable().optional(),
  frequency: z.enum(
    ['daily', 'weekly', 'biweekly', 'monthly', 'bimonthly', 'quarterly', 'yearly'],
    { message: 'Frecuencia inválida' },
  ),
  day_of_month: z.number().int().min(1).max(31).nullable().optional(),
  day_of_week: z.number().int().min(0).max(6).nullable().optional(),
  start_date: z.string().min(1, 'La fecha de inicio es requerida'),
  end_date: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  auto_create: z.boolean().default(false),
  advance_notice_days: z.number().int().min(1).max(30).default(3),
})

export type RecurringItemInput = z.infer<typeof recurringItemSchema>
