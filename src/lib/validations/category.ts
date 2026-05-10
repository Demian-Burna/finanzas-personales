import { z } from 'zod'

export const categorySchema = z.object({
  parent_id: z.string().uuid().nullable().optional(),
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede superar 100 caracteres'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido (debe ser #RRGGBB)')
    .nullable()
    .optional(),
  icon: z.string().max(50).nullable().optional(),
  transaction_type: z.enum(['income', 'expense', 'transfer'], {
    message: 'Tipo de transacción inválido',
  }),
  sort_order: z.number().int().min(0).default(0),
})

export type CategoryInput = z.infer<typeof categorySchema>
