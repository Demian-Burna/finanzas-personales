import { z } from 'zod'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)')

export const savingGoalSchema = z.object({
  account_id: z.string().uuid().nullable().optional(),
  currency_code: z.string().length(3).toUpperCase(),
  name: z.string().trim().min(1, 'El nombre es requerido').max(120),
  description: z.string().max(1000).nullable().optional(),
  target_amount: z.number().finite().positive('El objetivo debe ser positivo'),
  target_date: isoDate.nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color hex inválido')
    .nullable()
    .optional(),
  icon: z.string().max(50).nullable().optional(),
  status: z.enum(['active', 'completed', 'paused', 'cancelled']).default('active'),
})

export type SavingGoalFormInput = z.infer<typeof savingGoalSchema>

// Goal contribution
export const goalContributionSchema = z.object({
  goal_id: z.string().uuid(),
  transaction_id: z.string().uuid().nullable().optional(),
  amount: z.number().finite().positive('Monto positivo'),
  contribution_date: isoDate,
  note: z.string().max(500).nullable().optional(),
})
export type GoalContributionFormInput = z.infer<typeof goalContributionSchema>
