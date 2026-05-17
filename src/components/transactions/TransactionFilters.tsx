'use client'

import { useCallback, useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { createPortal } from 'react-dom'
import { Search, X, ChevronDown, Check, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FormShell } from '@/components/ui/form-shell'
import { CategoryCombobox } from '@/components/shared/CategoryCombobox'
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

const PILL = 'flex h-8 w-full items-center justify-between gap-1 rounded-full border border-input bg-transparent px-3 text-sm transition-colors select-none dark:bg-input/30 dark:hover:bg-input/50 hover:bg-accent/30'

// Lightweight portal select — same visual as CategoryCombobox pill trigger
function PortalSelect({
  options,
  value,
  onChange,
  placeholder,
  className,
}: {
  options: { value: string; label: string }[]
  value: string | undefined
  onChange: (v: string | null) => void
  placeholder: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  const selected = options.find((o) => o.value === value)

  function open_() {
    if (!triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()
    const w = Math.max(180, r.width)
    const left = window.innerWidth < 640
      ? Math.max(8, (window.innerWidth - w) / 2)
      : Math.min(r.left, window.innerWidth - w - 8)
    setPos({ top: r.bottom + 6, left, width: w })
    setOpen(true)
  }

  const dropdown = (
    <>
      <div className="fixed inset-0 z-[199]" onPointerDown={() => setOpen(false)} />
      <div
        ref={dropRef}
        className="fixed z-[200] rounded-xl border bg-popover shadow-lg ring-1 ring-foreground/10 py-1"
        style={{ top: pos.top, left: pos.left, width: pos.width }}
      >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => { onChange(o.value); setOpen(false) }}
          className={cn(
            'flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
            o.value === value && 'bg-accent/50',
          )}
        >
          <span className="flex-1 text-left">{o.label}</span>
          {o.value === value && <Check className="size-3.5 text-primary shrink-0" />}
        </button>
      ))}
    </div>
    </>
  )

  return (
    <div className={cn('relative flex-1 min-w-0 overflow-hidden', className)}>
      <button
        ref={triggerRef}
        type="button"
        onPointerDown={(e) => { e.preventDefault(); if (open) setOpen(false); else open_() }}
        className={cn(PILL, !selected && 'text-muted-foreground', open && 'ring-2 ring-ring border-ring')}
      >
        <span className="flex-1 truncate text-left">{selected ? selected.label : placeholder}</span>
        {selected
          ? <X className="size-3.5 shrink-0 text-muted-foreground" onPointerDown={(e) => { e.stopPropagation(); onChange(null) }} />
          : <ChevronDown className="size-4 shrink-0 text-muted-foreground pointer-events-none" />}
      </button>
      {mounted && open && createPortal(dropdown, document.body)}
    </div>
  )
}

function FilterContent({
  accounts,
  categories,
  update,
  params,
  typeValue,
  accountValue,
  categoryValue,
}: {
  accounts: AccountWithType[]
  categories: CategoryWithParent[]
  update: (key: string, value: string | null) => void
  params: URLSearchParams
  typeValue: string | undefined
  accountValue: string | undefined
  categoryValue: string | undefined
}) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="space-y-5 py-1">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo de movimiento</p>
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => update('type', typeValue === o.value ? null : o.value)}
              className={cn(
                'rounded-full border px-3 py-1 text-sm transition-colors',
                typeValue === o.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:bg-muted',
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cuenta</p>
        <div className="flex flex-wrap gap-2">
          {accounts.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => update('account', accountValue === a.id ? null : a.id)}
              className={cn(
                'rounded-full border px-3 py-1 text-sm transition-colors',
                accountValue === a.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:bg-muted',
              )}
            >
              {a.icon ? `${a.icon} ` : ''}{a.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categoría</p>
        <CategoryCombobox
          categories={categories}
          value={categoryValue}
          onChange={(id) => update('category', id)}
          placeholder="Todas las categorías"
        />
      </div>

      {['type', 'account', 'category', 'q'].some((k) => params.has(k)) && (
        <button
          type="button"
          onClick={() => router.replace(pathname)}
          className="text-sm text-muted-foreground underline-offset-2 hover:underline"
        >
          Limpiar todos los filtros
        </button>
      )}
    </div>
  )
}

interface TransactionFiltersProps extends Props {
  externalSheetOpen?: boolean
  onExternalSheetClose?: () => void
}

export function TransactionFilters({ accounts, categories, externalSheetOpen, onExternalSheetClose }: TransactionFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [sheetOpen, setSheetOpen] = useState(false)

  const effectiveSheetOpen = externalSheetOpen ?? sheetOpen
  const handleSheetClose = () => {
    setSheetOpen(false)
    onExternalSheetClose?.()
  }

  const update = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString())
      if (value) next.set(key, value)
      else next.delete(key)
      next.delete('cursor')
      router.replace(`${pathname}?${next.toString()}`)
    },
    [params, pathname, router],
  )

  const hasFilters = ['type', 'account', 'category', 'q'].some((k) => params.has(k))
  const typeValue     = params.get('type') ?? undefined
  const accountValue  = params.get('account') ?? undefined
  const categoryValue = params.get('category') ?? undefined

  return (
    <div className="flex-1 min-w-0 space-y-2">
      {/* Search row — always visible */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por descripción..."
            defaultValue={params.get('q') ?? ''}
            onChange={(e) => update('q', e.target.value || null)}
            className="pl-8 h-8 text-sm rounded-full"
          />
        </div>

        {/* Mobile: filter icon button → sheet */}
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden size-8 shrink-0 rounded-full relative"
          onClick={() => setSheetOpen(true)}
          aria-label="Filtros"
        >
          <SlidersHorizontal className="size-3.5" />
          {hasFilters && (
            <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-primary" />
          )}
        </Button>
      </div>

      {/* Desktop: inline filter pills */}
      <div className="hidden lg:flex flex-nowrap gap-1.5 overflow-hidden">
        <PortalSelect
          options={TYPE_OPTIONS}
          value={typeValue}
          onChange={(v) => update('type', v)}
          placeholder="Tipo"
        />

        <PortalSelect
          options={accounts.map((a) => ({ value: a.id, label: a.name }))}
          value={accountValue}
          onChange={(v) => update('account', v)}
          placeholder="Cuenta"
        />

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

      {/* Mobile filter sheet */}
      <FormShell
        open={effectiveSheetOpen}
        onOpenChange={handleSheetClose}
        title="Filtros"
        primaryAction={
          <Button size="sm" variant="outline" onClick={handleSheetClose}>
            Aplicar
          </Button>
        }
      >
        <FilterContent
          accounts={accounts}
          categories={categories}
          update={update}
          params={params}
          typeValue={typeValue}
          accountValue={accountValue}
          categoryValue={categoryValue}
        />
      </FormShell>
    </div>
  )
}
