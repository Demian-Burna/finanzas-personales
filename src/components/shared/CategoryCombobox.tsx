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
  /** Use pill (rounded-full) trigger style — matches Tipo/Cuenta filters */
  pill?: boolean
}

interface DropdownPos { top: number; left: number; width: number }

export function CategoryCombobox({
  categories,
  value,
  onChange,
  placeholder = 'Seleccioná una categoría',
  className,
  pill = false,
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
    // Center on narrow screens (<640), align to trigger on desktop
    const left = window.innerWidth < 640
      ? Math.max(8, (window.innerWidth - dropW) / 2)
      : Math.min(rect.left, window.innerWidth - dropW - 8)
    setPos({ top: rect.bottom + 6, left, width: dropW })
    setOpen(true)
  }

  // Outside-click: close when tapping outside trigger and dropdown
  useEffect(() => {
    if (!open) return
    function handler(e: PointerEvent) {
      const t = e.target as Node
      if (!triggerRef.current?.contains(t) && !dropdownRef.current?.contains(t)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10)
  }, [open])

  // No resize listener — iOS keyboard opening fires a resize event which
  // would close the dropdown while the user is typing in the search box

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
      className="fixed z-[200] rounded-xl border bg-popover shadow-lg ring-1 ring-foreground/10"
      style={{ top: pos.top, left: pos.left, width: pos.width }}
    >
      <div className="border-b p-1.5">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar..."
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
              onPointerDown={(e) => {
                e.preventDefault() // prevent outside-click handler from firing first
                select(c.id)
              }}
              className={cn(
                'flex w-full items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left text-sm transition-colors',
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
      <button
        ref={triggerRef}
        type="button"
        onPointerDown={(e) => {
          // Use pointerDown + preventDefault to avoid double-fire on iOS
          // (iOS fires both touchstart and a synthetic click from the same tap)
          e.preventDefault()
          if (open) { setOpen(false); setSearch('') } else openDropdown()
        }}
        className={cn(
          'flex w-full items-center justify-between gap-1 border border-input bg-transparent text-sm transition-colors outline-none select-none',
          'hover:bg-accent/30 focus-visible:ring-2 focus-visible:ring-ring',
          'dark:bg-input/30 dark:hover:bg-input/50',
          pill
            ? 'h-8 rounded-full px-3 py-1'
            : 'h-9 rounded-lg px-2.5 py-2',
          !selected && 'text-muted-foreground',
          open && 'ring-2 ring-ring border-ring',
        )}
      >
        <span className="flex-1 truncate text-left">
          {selected ? `${selected.icon ?? ''} ${selected.name}` : placeholder}
        </span>
        {selected ? (
          <X className="size-3.5 shrink-0 text-muted-foreground" onClick={clear} />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground pointer-events-none" />
        )}
      </button>

      {mounted && open && createPortal(dropdown, document.body)}
    </div>
  )
}
