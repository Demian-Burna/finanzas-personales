import { z } from 'zod'

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Color hex inválido (ej. #3b82f6)')

export const accountSchema = z.object({
  account_type_id: z.string().uuid('Tipo de cuenta inválido'),
  currency_code: z.string().length(3, 'Código ISO 4217').toUpperCase(),
  name: z.string().trim().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  description: z.string().max(500).nullable().optional(),
  initial_balance: z
    .number()
    .finite()
    .min(-1_000_000_000_000, 'Balance fuera de rango')
    .max(1_000_000_000_000, 'Balance fuera de rango')
    .default(0),
  color: hexColor.nullable().optional(),
  icon: z.string().max(50).nullable().optional(),
  is_active: z.boolean().default(true),
  include_in_net_worth: z.boolean().default(true),
  sort_order: z.number().int().nonnegative().default(0),
})

export type AccountFormInput = z.infer<typeof accountSchema>

export const accountUpdateSchema = accountSchema.partial()
export type AccountUpdateInput = z.infer<typeof accountUpdateSchema>
