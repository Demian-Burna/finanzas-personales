import { z } from 'zod'

export const tagSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido').max(50),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color hex inválido')
    .nullable()
    .optional(),
})
export type TagFormInput = z.infer<typeof tagSchema>
