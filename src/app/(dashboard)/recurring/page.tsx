import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getRecurringItems } from '@/lib/supabase/queries/recurring-items'
import { getAccounts } from '@/lib/supabase/queries/accounts'
import { getCategories } from '@/lib/supabase/queries/categories'
import { RecurringClient } from '@/components/recurring/RecurringClient'

export const metadata: Metadata = { title: 'Recurrentes' }

async function getUserPrefs() {
  const supabase = await createClient()
  const { data: profileRaw } = await supabase.from('profiles').select('base_currency,locale').single()
  const profile = profileRaw as { base_currency: string | null; locale: string | null } | null
  return { currency: profile?.base_currency ?? 'ARS', locale: profile?.locale ?? 'es-AR' }
}

async function RecurringData() {
  const supabase = await createClient()
  const [{ currency, locale }, { data: items }, { data: accounts }, { data: categories }] = await Promise.all([
    getUserPrefs(),
    getRecurringItems(supabase),
    getAccounts(supabase),
    getCategories(supabase),
  ])
  return <RecurringClient items={items} accounts={accounts} categories={categories} currency={currency} locale={locale} />
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-16 rounded-xl border bg-card animate-pulse" />
      ))}
    </div>
  )
}

export default function RecurringPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Recurrentes</h1>
        <p className="text-sm text-muted-foreground">Ingresos y gastos que se repiten periódicamente</p>
      </div>
      <Suspense fallback={<Skeleton />}>
        <RecurringData />
      </Suspense>
    </div>
  )
}
