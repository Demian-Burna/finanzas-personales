import { z } from 'zod'

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido (debe ser #RRGGBB)')
  .nullable()
  .optional()

export const accountSchema = z.object({
  account_type_id: z.string().uuid('Tipo de cuenta inválido'),
  currency_code: z.string().length(3, 'Moneda inválida (código ISO de 3 letras)'),
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede superar 100 caracteres'),
  description: z.string().max(500, 'La descripción no puede superar 500 caracteres').nullable().optional(),
  initial_balance: z.number().default(0),
  color: hexColor,
  icon: z.string().max(50).nullable().optional(),
  include_in_net_worth: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
})

export type AccountInput = z.infer<typeof accountSchema>
