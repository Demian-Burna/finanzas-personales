'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CategoryWithParent } from '@/lib/supabase/queries/categories'

interface Props {
  categories: CategoryWithParent[]
  value: string | null | undefined
  onChange: (id: string | null) => void
  placeholder?: string
  className?: string
}

/**
 * Searchable category picker — avoids long scrolling lists.
 * Shared by TransactionFilters, BudgetForm, RecurringForm, etc.
 */
export function CategoryCombobox({
  categories,
  value,
  onChange,
  placeholder = 'Seleccioná una categoría',
  className,
}: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = categories.find((c) => c.id === value)
  const filtered = search
    ? categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : categories

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
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none',
          'hover:bg-accent/30 focus-visible:ring-2 focus-visible:ring-ring',
          open && 'ring-2 ring-ring',
          !selected && 'text-muted-foreground',
        )}
      >
        <span className="flex-1 truncate text-left">
          {selected ? `${selected.icon ?? ''} ${selected.name}` : placeholder}
        </span>
        {selected ? (
          <X className="size-3.5 shrink-0 text-muted-foreground hover:text-foreground" onClick={clear} />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[220px] rounded-xl border bg-popover shadow-lg ring-1 ring-foreground/10">
          <div className="border-b p-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar categoría..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border bg-muted/30 py-1.5 pl-7 pr-2 text-xs outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-muted-foreground">Sin resultados</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => select(c.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
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
