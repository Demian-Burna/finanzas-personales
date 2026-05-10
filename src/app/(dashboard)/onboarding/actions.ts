'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface OnboardingData {
  currency_code: string
  timezone: string
  locale: string
  account_type_id: string
  account_name: string
  initial_balance: number
}

export async function completeOnboarding(data: OnboardingData) {
  const supabase = await createClient()

  const { data: _authData } = await supabase.auth.getUser(); const user = _authData?.user ?? null
  if (!user) redirect('/login')

  // Update profile with preferences and mark onboarding done
  await supabase
    .from('profiles')
    .update({
      currency_code: data.currency_code,
      timezone: data.timezone,
      locale: data.locale,
      onboarding_completed_at: new Date().toISOString(),
    } as never)
    .eq('id', user.id)

  // Create first account (initial_balance = current_balance is handled by DB trigger)
  await supabase.from('accounts').insert({
    user_id: user.id,
    account_type_id: data.account_type_id,
    currency_code: data.currency_code,
    name: data.account_name,
    initial_balance: data.initial_balance,
    current_balance: data.initial_balance,
    include_in_net_worth: true,
    sort_order: 0,
    is_active: true,
  } as never)

  redirect('/')
}
