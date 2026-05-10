import { z } from 'zod'

export const accountSchema = z.object({
  // Use min(1) instead of uuid() — base-ui Select can pass '' which fails uuid()
  account_type_id: z.string().min(1, 'Seleccioná el tipo de cuenta'),
  // Allow up to 5 chars (USDT = 4, most ISO are 3)
  currency_code: z.string().min(2).max(5),
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede superar 100 caracteres'),
  description: z.string().max(500).nullable().optional(),
  initial_balance: z.coerce.number().default(0),
  // Accept any 6-char hex color or null
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  icon: z.string().max(50).nullable().optional(),
  include_in_net_worth: z.boolean().default(true),
  sort_order: z.coerce.number().int().min(0).default(0),
})

export type AccountInput = z.infer<typeof accountSchema>
