import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAccounts } from '@/lib/supabase/queries/accounts'
import { getCategories } from '@/lib/supabase/queries/categories'
import { TransactionsClient } from '@/components/transactions/TransactionsClient'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Transacciones',
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

export default async function TransactionsPage() {
  const supabase = await createClient()

  const [{ currency, locale }, { data: accounts }, { data: categories }] = await Promise.all([
    getUserPrefs(),
    getAccounts(supabase),
    getCategories(supabase),
  ])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transacciones</h1>
          <p className="text-sm text-muted-foreground">Registrá y gestioná tus movimientos</p>
        </div>
        {/* base-ui Button supports render prop to swap root element */}
        <Button
          variant="outline"
          size="sm"
          render={<Link href="/transactions/import" />}
          className="gap-1.5 hidden sm:inline-flex"
        >
          <Upload className="size-4" />
          Importar CSV
        </Button>
      </div>

      <Suspense>
        <TransactionsClient
          accounts={accounts}
          categories={categories}
          currency={currency}
          locale={locale}
        />
      </Suspense>
    </div>
  )
}
