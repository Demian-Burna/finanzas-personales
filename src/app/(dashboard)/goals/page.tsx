import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getSavingGoals } from '@/lib/supabase/queries/saving-goals'
import { getAccounts } from '@/lib/supabase/queries/accounts'
import { GoalsClient } from '@/components/goals/GoalsClient'

export const metadata: Metadata = { title: 'Metas' }

async function getUserPrefs() {
  const supabase = await createClient()
  const { data: profileRaw } = await supabase.from('profiles').select('currency_code,locale').single()
  const profile = profileRaw as { currency_code: string | null; locale: string | null } | null
  return { currency: profile?.currency_code ?? 'ARS', locale: profile?.locale ?? 'es-AR' }
}

async function GoalsData() {
  const supabase = await createClient()
  const [{ currency, locale }, { data: goals }, { data: accounts }] = await Promise.all([
    getUserPrefs(),
    getSavingGoals(supabase),
    getAccounts(supabase),
  ])
  return <GoalsClient goals={goals} accounts={accounts ?? []} currency={currency} locale={locale} />
}

function Skeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-52 rounded-xl border bg-card animate-pulse" />
      ))}
    </div>
  )
}

export default function GoalsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Metas de ahorro</h1>
        <p className="text-sm text-muted-foreground">Seguimiento de tus objetivos financieros</p>
      </div>
      <Suspense fallback={<Skeleton />}>
        <GoalsData />
      </Suspense>
    </div>
  )
}
