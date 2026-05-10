import { z } from 'zod'

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color hex inválido')

export const categorySchema = z.object({
  parent_id: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(1, 'El nombre es requerido').max(80),
  color: hexColor.nullable().optional(),
  icon: z.string().max(50).nullable().optional(),
  transaction_type: z.enum(['income', 'expense', 'transfer']),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().nonnegative().default(0),
})

export type CategoryFormInput = z.infer<typeof categorySchema>

export const categoryUpdateSchema = categorySchema.partial()
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>
