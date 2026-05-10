import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAccounts } from '@/lib/supabase/queries/accounts'
import { CsvImportClient } from './_components/CsvImportClient'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Importar CSV',
}

export default async function ImportPage() {
  const supabase = await createClient()
  const { data: accounts } = await getAccounts(supabase)

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" render={<Link href="/transactions" />}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Importar CSV</h1>
          <p className="text-sm text-muted-foreground">Subí un archivo CSV para importar transacciones en lote</p>
        </div>
      </div>

      <CsvImportClient accounts={accounts} />
    </div>
  )
}
