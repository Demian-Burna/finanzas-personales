'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AccountWithType } from '@/lib/supabase/queries/accounts'
import type { CategoryWithParent } from '@/lib/supabase/queries/categories'

interface Props {
  accounts: AccountWithType[]
  categories: CategoryWithParent[]
}

const TYPE_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'income', label: 'Ingresos' },
  { value: 'expense', label: 'Gastos' },
  { value: 'transfer', label: 'Transferencias' },
]

export function TransactionFilters({ accounts, categories }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const update = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString())
      if (value && value !== 'all') {
        next.set(key, value)
      } else {
        next.delete(key)
      }
      next.delete('cursor') // reset pagination on filter change
      router.replace(`${pathname}?${next.toString()}`)
    },
    [params, pathname, router],
  )

  const hasFilters = ['type', 'account', 'category', 'q'].some((k) => params.has(k))

  function clearFilters() {
    router.replace(pathname)
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar..."
          defaultValue={params.get('q') ?? ''}
          onChange={(e) => update('q', e.target.value || null)}
          className="pl-8 h-8 text-sm"
        />
      </div>

      {/* Type */}
      <Select
        value={params.get('type') ?? 'all'}
        onValueChange={(v) => update('type', v)}
      >
        <SelectTrigger size="sm" className="w-[130px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          {TYPE_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Account */}
      <Select
        value={params.get('account') ?? 'all'}
        onValueChange={(v) => update('account', v)}
      >
        <SelectTrigger size="sm" className="w-[140px]">
          <SelectValue placeholder="Cuenta" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las cuentas</SelectItem>
          {accounts.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Category */}
      <Select
        value={params.get('category') ?? 'all'}
        onValueChange={(v) => update('category', v)}
      >
        <SelectTrigger size="sm" className="w-[150px]">
          <SelectValue placeholder="Categoría" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las categorías</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.icon ?? ''} {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 h-8 text-xs">
          <X className="size-3" />
          Limpiar
        </Button>
      )}
    </div>
  )
}
