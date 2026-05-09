import { z } from 'zod'

export const profileSchema = z.object({
  display_name: z
    .string()
    .min(1, 'El nombre no puede estar vacío')
    .max(100, 'El nombre no puede superar 100 caracteres')
    .nullable()
    .optional(),
  avatar_url: z.string().url('URL de avatar inválida').nullable().optional(),
  currency_code: z.string().length(3, 'Moneda inválida (código ISO de 3 letras)'),
  locale: z.string().max(10, 'Locale inválido'),
  timezone: z.string().max(50, 'Zona horaria inválida'),
})

export type ProfileInput = z.infer<typeof profileSchema>
