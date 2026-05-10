'use client'

import { useCallback, useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, X, ChevronDown, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
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

// ----- Searchable category combobox ----------------------------------------

interface CategoryComboboxProps {
  categories: CategoryWithParent[]
  value: string | undefined
  onChange: (id: string | null) => void
}

function CategoryCombobox({ categories, value, onChange }: CategoryComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = categories.find((c) => c.id === value)

  const filtered = search
    ? categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : categories

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Focus search input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10)
  }, [open])

  function select(id: string) {
    onChange(id)
    setOpen(false)
    setSearch('')
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange(null)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={containerRef} className="relative flex-1 min-w-[90px] max-w-[200px]">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent px-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none',
          'hover:bg-accent/30 focus-visible:ring-2 focus-visible:ring-ring',
          open && 'ring-2 ring-ring',
        )}
      >
        <span className={cn('flex-1 truncate text-left', !selected && 'text-muted-foreground')}>
          {selected ? `${selected.icon ?? ''} ${selected.name}` : 'Categoría'}
        </span>
        {selected ? (
          <X className="size-3.5 shrink-0 text-muted-foreground hover:text-foreground" onClick={clear} />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-xl border bg-popover shadow-lg ring-1 ring-foreground/10">
          {/* Search input */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar categoría..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border bg-muted/30 pl-7 pr-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-52 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-2 py-3 text-xs text-center text-muted-foreground">Sin resultados</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => select(c.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors text-left',
                    'hover:bg-accent hover:text-accent-foreground',
                    c.id === value && 'bg-accent/50',
                  )}
                >
                  {c.icon && <span className="shrink-0">{c.icon}</span>}
                  <span className="flex-1 truncate">{c.name}</span>
                  {c.id === value && <Check className="size-3.5 shrink-0 text-primary" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ----- Main filter bar -------------------------------------------------------

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
      {/* Row 1 — search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar por descripción..."
          defaultValue={params.get('q') ?? ''}
          onChange={(e) => update('q', e.target.value || null)}
          className="pl-8 h-9 text-sm"
        />
      </div>

      {/* Row 2 — type / account / category / clear */}
      <div className="flex flex-wrap gap-2">
        {/* Type */}
        <Select value={typeValue} onValueChange={(v) => update('type', v || null)}>
          <SelectTrigger size="sm" className="flex-1 min-w-[90px] max-w-[160px] h-9">
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

        {/* Account */}
        <Select value={accountValue} onValueChange={(v) => update('account', v || null)}>
          <SelectTrigger size="sm" className="flex-1 min-w-[90px] max-w-[180px] h-9">
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

        {/* Category — searchable combobox */}
        <CategoryCombobox
          categories={categories}
          value={categoryValue}
          onChange={(id) => update('category', id)}
        />

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.replace(pathname)}
            className="gap-1 h-9 text-xs shrink-0"
          >
            <X className="size-3" />
            Limpiar
          </Button>
        )}
      </div>
    </div>
  )
}
