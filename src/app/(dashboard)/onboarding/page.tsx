import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from './_components/onboarding-wizard'
import { completeOnboarding } from './actions'

export const metadata: Metadata = { title: 'ConfiguraciÃ³n inicial' }

export default async function OnboardingPage() {
  const supabase = await createClient()

  const { data: _authData } = await supabase.auth.getUser(); const user = _authData?.user ?? null
  if (!user) redirect('/login')

  // If already onboarded, send to dashboard
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('onboarding_completed_at')
    .eq('id', user.id)
    .single()
  const profile = profileRaw as { onboarding_completed_at: string | null } | null

  if (profile?.onboarding_completed_at) {
    redirect('/')
  }

  // Fetch asset account types for the wizard
  const { data: accountTypesRaw } = await supabase
    .from('account_types')
    .select('id, name, nature, icon')
    .order('sort_order', { ascending: true })
  const accountTypes = accountTypesRaw as Array<{
    id: string
    name: string
    nature: 'asset' | 'liability'
    icon: string | null
  }> | null

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg space-y-10">
        {/* Header */}
        <div className="space-y-1 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Bienvenido/a ðŸ‘‹</h1>
          <p className="text-muted-foreground">Configuremos tu cuenta en 3 pasos rÃ¡pidos</p>
        </div>

        <OnboardingWizard
          accountTypes={accountTypes ?? []}
          completeOnboardingAction={completeOnboarding}
        />
      </div>
    </div>
  )
}
