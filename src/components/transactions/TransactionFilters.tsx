'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, X, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CategoryCombobox } from '@/components/shared/CategoryCombobox'
import type { AccountWithType } from '@/lib/supabase/queries/accounts'
import type { CategoryWithParent } from '@/lib/supabase/queries/categories'

interface Props {
  accounts: AccountWithType[]
  categories: CategoryWithParent[]
}

const TYPE_OPTIONS = [
  { value: 'income',   label: 'Ingresos' },
  { value: 'expense',  label: 'Gastos' },
  { value: 'transfer', label: 'Transferencias' },
]

// Shared pill class for all three filter triggers
const PILL = 'flex-1 h-8 rounded-full border border-input text-sm font-normal'

export function TransactionFilters({ accounts, categories }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const update = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString())
      if (value) {
        next.set(key, value)
      } else {
        next.delete(key)
      }
      next.delete('cursor')
      router.replace(`${pathname}?${next.toString()}`)
    },
    [params, pathname, router],
  )

  const hasFilters = ['type', 'account', 'category', 'q'].some((k) => params.has(k))

  const typeValue     = params.get('type') ?? undefined
  const accountValue  = params.get('account') ?? undefined
  const categoryValue = params.get('category') ?? undefined

  const selectedAccount = accounts.find((a) => a.id === accountValue)
  const selectedType    = TYPE_OPTIONS.find((o) => o.value === typeValue)

  return (
    <div className="flex-1 min-w-0 space-y-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar por descripción..."
          defaultValue={params.get('q') ?? ''}
          onChange={(e) => update('q', e.target.value || null)}
          className="pl-8 h-8 text-sm rounded-full"
        />
      </div>

      {/* Filter pills — all three identical pill shape, equal flex-1 */}
      <div className="flex gap-1.5">
        {/* Tipo */}
        <Select value={typeValue} onValueChange={(v) => update('type', v || null)}>
          <SelectTrigger className={PILL}>
            <SelectValue>
              {selectedType
                ? selectedType.label
                : <span className="text-muted-foreground">Tipo</span>}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Cuenta */}
        <Select value={accountValue} onValueChange={(v) => update('account', v || null)}>
          <SelectTrigger className={PILL}>
            <SelectValue>
              {selectedAccount
                ? selectedAccount.name
                : <span className="text-muted-foreground">Cuenta</span>}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Categoría — pill prop makes it match the SelectTrigger style */}
        <CategoryCombobox
          categories={categories}
          value={categoryValue}
          onChange={(id) => update('category', id)}
          placeholder="Categoría"
          pill
          className="flex-1"
        />

        {hasFilters && (
          <button
            onClick={() => router.replace(pathname)}
            className="flex items-center justify-center size-8 shrink-0 rounded-full border border-input text-muted-foreground hover:bg-muted transition-colors"
            title="Limpiar filtros"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
