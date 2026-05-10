import { z } from 'zod'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)')

const frequency = z.enum([
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'bimonthly',
  'quarterly',
  'yearly',
])

export const recurringItemSchema = z
  .object({
    account_id: z.string().uuid('Cuenta inválida'),
    category_id: z.string().uuid().nullable().optional(),
    currency_code: z.string().length(3).toUpperCase(),
    amount: z.number().finite().positive('El monto debe ser positivo'),
    transaction_type: z.enum(['income', 'expense', 'transfer']),
    description: z.string().trim().min(1, 'La descripción es requerida').max(255),
    notes: z.string().max(2000).nullable().optional(),
    frequency,
    /** 1-31; 29-31 are clamped to the last day of short months at execution. */
    day_of_month: z.number().int().min(1).max(31).nullable().optional(),
    /** 0=Sunday … 6=Saturday. */
    day_of_week: z.number().int().min(0).max(6).nullable().optional(),
    start_date: isoDate,
    end_date: isoDate.nullable().optional(),
    auto_create: z.boolean().default(false),
    advance_notice_days: z.number().int().nonnegative().max(60).default(3),
    is_active: z.boolean().default(true),
  })
  .superRefine((val, ctx) => {
    // end_date >= start_date
    if (val.end_date && val.end_date < val.start_date) {
      ctx.addIssue({
        code: 'custom',
        path: ['end_date'],
        message: 'La fecha de fin no puede ser anterior al inicio',
      })
    }
    // Frequency-specific required fields.
    const monthlyKinds: typeof val.frequency[] = [
      'monthly',
      'bimonthly',
      'quarterly',
      'yearly',
    ]
    if (monthlyKinds.includes(val.frequency) && val.day_of_month == null) {
      ctx.addIssue({
        code: 'custom',
        path: ['day_of_month'],
        message: 'Día del mes requerido para frecuencias mensuales',
      })
    }
    if ((val.frequency === 'weekly' || val.frequency === 'biweekly') && val.day_of_week == null) {
      ctx.addIssue({
        code: 'custom',
        path: ['day_of_week'],
        message: 'Día de la semana requerido',
      })
    }
  })

export type RecurringItemFormInput = z.infer<typeof recurringItemSchema>
