import { z } from 'zod'

export const tagSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(50, 'El nombre no puede superar 50 caracteres'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido (debe ser #RRGGBB)')
    .nullable()
    .optional(),
})

export type TagInput = z.infer<typeof tagSchema>
