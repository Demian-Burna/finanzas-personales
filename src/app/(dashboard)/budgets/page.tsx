import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getBudgetsWithProgress } from '@/lib/supabase/queries/budgets'
import { getCategories } from '@/lib/supabase/queries/categories'
import { BudgetsClient, BudgetsClientSkeleton } from '@/components/budgets/BudgetsClient'

export const metadata: Metadata = {
  title: 'Presupuestos',
}

async function getUserPrefs() {
  const supabase = await createClient()
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('base_currency,locale')
    .single()
  const profile = profileRaw as { base_currency: string | null; locale: string | null } | null
  return {
    currency: profile?.base_currency ?? 'ARS',
    locale: profile?.locale ?? 'es-AR',
  }
}

async function BudgetsData() {
  const supabase = await createClient()
  const now = new Date()
  const referenceDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const [{ currency, locale }, { data: budgets }, { data: categories }] = await Promise.all([
    getUserPrefs(),
    getBudgetsWithProgress(supabase, referenceDate),
    getCategories(supabase, { type: 'expense' }),
  ])

  return (
    <BudgetsClient
      budgets={budgets}
      categories={categories}
      currency={currency}
      locale={locale}
    />
  )
}

export default function BudgetsPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Presupuestos</h1>
          <p className="text-sm text-muted-foreground">Control de gastos por categoría</p>
        </div>
      </div>

      <Suspense fallback={<BudgetsClientSkeleton />}>
        <BudgetsData />
      </Suspense>
    </div>
  )
}
