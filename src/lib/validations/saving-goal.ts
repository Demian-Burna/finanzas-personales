import { z } from 'zod'

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido (debe ser #RRGGBB)')
  .nullable()
  .optional()

export const savingGoalSchema = z.object({
  account_id: z.string().uuid().nullable().optional(),
  currency_code: z.string().length(3, 'Moneda inválida (código ISO de 3 letras)'),
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede superar 100 caracteres'),
  description: z.string().max(500).nullable().optional(),
  target_amount: z.number().positive('El monto objetivo debe ser positivo'),
  target_date: z.string().nullable().optional(),
  color: hexColor,
  icon: z.string().max(50).nullable().optional(),
})

export type SavingGoalInput = z.infer<typeof savingGoalSchema>

export const goalContributionSchema = z.object({
  goal_id: z.string().uuid('Meta inválida'),
  transaction_id: z.string().uuid().nullable().optional(),
  amount: z.number().positive('El monto debe ser positivo'),
  note: z.string().max(500).nullable().optional(),
  contribution_date: z.string().min(1, 'La fecha es requerida'),
})

export type GoalContributionInput = z.infer<typeof goalContributionSchema>
