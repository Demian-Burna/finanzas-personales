'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
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

interface DropdownPos { top: number; left: number; width: number }

/**
 * Searchable category picker — portal + fixed positioning so it is never
 * clipped by overflow:hidden parents or flex containers on mobile.
 * Trigger styled identically to the Base UI SelectTrigger (size=sm).
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
  const [pos, setPos] = useState<DropdownPos>({ top: 0, left: 0, width: 240 })
  const [mounted, setMounted] = useState(false)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  const selected = categories.find((c) => c.id === value)
  const filtered = search
    ? categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : categories

  function openDropdown() {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const dropW = Math.max(240, rect.width)
    const left = Math.min(rect.left, window.innerWidth - dropW - 8)
    setPos({ top: rect.bottom + 4, left: Math.max(8, left), width: dropW })
    setOpen(true)
  }

  // Close on outside click — check both trigger and dropdown refs
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      const t = e.target as Node
      if (!triggerRef.current?.contains(t) && !dropdownRef.current?.contains(t)) {
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

  // Close on resize only (NOT scroll — iOS scroll fires on tap and closes immediately)
  useEffect(() => {
    if (!open) return
    const close = () => { setOpen(false); setSearch('') }
    window.addEventListener('resize', close)
    return () => window.removeEventListener('resize', close)
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

  const dropdown = (
    <div
      ref={dropdownRef}
      className="fixed z-[200] rounded-lg bg-popover shadow-md ring-1 ring-foreground/10"
      style={{ top: pos.top, left: pos.left, width: pos.width }}
    >
      <div className="border-b p-1.5">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md bg-muted/30 py-1.5 pl-7 pr-2 text-sm outline-none"
          />
        </div>
      </div>
      <div className="max-h-52 overflow-y-auto p-1">
        {filtered.length === 0 ? (
          <p className="px-2 py-3 text-center text-sm text-muted-foreground">Sin resultados</p>
        ) : (
          filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={(e) => {
                // Use mousedown + preventDefault to avoid the outside-click
                // handler on document firing before onClick
                e.preventDefault()
                select(c.id)
              }}
              className={cn(
                'flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-sm transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                c.id === value && 'bg-accent/50',
              )}
            >
              {c.icon && <span className="shrink-0">{c.icon}</span>}
              <span className="flex-1 truncate">{c.name}</span>
              {c.id === value && <Check className="size-3.5 shrink-0 ml-auto text-primary" />}
            </button>
          ))
        )}
      </div>
    </div>
  )

  return (
    <div className={cn('relative', className)}>
      {/* Trigger — styled identically to Base UI SelectTrigger size="sm" */}
      <button
        ref={triggerRef}
        type="button"
        data-placeholder={!selected || undefined}
        onClick={() => (open ? (setOpen(false), setSearch('')) : openDropdown())}
        className={cn(
          // Matches SelectTrigger base classes exactly
          'flex w-fit items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          'dark:bg-input/30 dark:hover:bg-input/50',
          // Size sm height
          'h-7',
          // Placeholder colour
          !selected && 'text-muted-foreground',
          open && 'border-ring ring-3 ring-ring/50',
          // Allow parent to override width
          'w-full',
        )}
      >
        <span className="flex-1 truncate text-left line-clamp-1">
          {selected ? `${selected.icon ?? ''} ${selected.name}` : placeholder}
        </span>
        {selected ? (
          <X
            className="size-4 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={clear}
          />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground pointer-events-none" />
        )}
      </button>

      {mounted && open && createPortal(dropdown, document.body)}
    </div>
  )
}
