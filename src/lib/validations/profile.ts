import { z } from 'zod'

export const profileUpdateSchema = z.object({
  display_name: z.string().trim().min(1).max(100).nullable().optional(),
  avatar_url: z.string().url('URL inválida').nullable().optional(),
  currency_code: z.string().length(3).toUpperCase().optional(),
  locale: z.string().max(10).optional(),
  timezone: z.string().max(50).optional(),
})
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>

export const onboardingStep1Schema = z.object({
  currency_code: z.string().length(3).toUpperCase(),
  locale: z.string().max(10),
  timezone: z.string().max(50),
})
export type OnboardingStep1Input = z.infer<typeof onboardingStep1Schema>
