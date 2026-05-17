'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, ArrowLeft, Clock, RefreshCcw, PieChart, Target } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getTransactions } from '@/lib/supabase/queries/transactions'
import type { TransactionWithRelations } from '@/lib/supabase/queries/transactions'
import { TxRow } from '@/components/shared/TxRow'
import { cn } from '@/lib/utils'

const RECENTS_KEY = 'tx-search-recents'
const MAX_RECENTS = 6

function loadRecents(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(RECENTS_KEY) ?? '[]') as string[] } catch { return [] }
}

function saveRecent(term: string) {
  const prev = loadRecents().filter((r) => r !== term)
  localStorage.setItem(RECENTS_KEY, JSON.stringify([term, ...prev].slice(0, MAX_RECENTS)))
}

function highlight(text: string, query: string) {
  if (!query) return <span>{text}</span>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <span>{text}</span>
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 dark:bg-yellow-800/60 text-foreground rounded-[2px] px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </span>
  )
}

interface Props {
  open: boolean
  onClose: () => void
  currency: string
  locale: string
}

export function SearchOverlay({ open, onClose, currency, locale }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TransactionWithRelations[]>([])
  const [loading, setLoading] = useState(false)
  const [recents, setRecents] = useState<string[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Focus and load recents when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setRecents(loadRecents())
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [open])

  const search = useCallback(async (term: string) => {
    if (term.length < 2) { setResults([]); setLoading(false); return }
    setLoading(true)
    const supabase = createClient()
    const { data } = await getTransactions(supabase, { search: term, pageSize: 10 })
    setResults(data)
    setLoading(false)
  }, [])

  function handleChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void search(value), 300)
  }

  function handleSubmit(term: string) {
    if (!term.trim()) return
    saveRecent(term.trim())
    setRecents(loadRecents())
    onClose()
    router.push(`/transactions?q=${encodeURIComponent(term.trim())}`)
  }

  function handleRecentClick(term: string) {
    setQuery(term)
    void search(term)
  }

  if (!open) return null

  const showRecents = query.length < 2 && recents.length > 0
  const showResults = query.length >= 2

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <button
          type="button"
          onClick={onClose}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft className="size-5" strokeWidth={1.75} />
        </button>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(query) }}
            placeholder="Buscar transacciones..."
            className="w-full rounded-xl border bg-muted/40 py-2 pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3">

        {/* Recent searches */}
        {showRecents && (
          <div className="mb-5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Recientes</p>
            <div className="flex flex-wrap gap-2">
              {recents.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRecentClick(r)}
                  className="flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                >
                  <Clock className="size-3 text-muted-foreground" />
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-10">
            <div className="size-5 animate-spin rounded-full border-2 border-border border-t-foreground" />
          </div>
        )}

        {/* Results */}
        {showResults && !loading && (
          <>
            {results.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Sin resultados para &ldquo;{query}&rdquo;
              </p>
            ) : (
              <div className="mb-5">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {results.length} resultado{results.length !== 1 ? 's' : ''}
                </p>
                <div className="divide-y divide-border rounded-xl border bg-card overflow-hidden">
                  {results.map((tx) => (
                    <button
                      key={tx.id}
                      type="button"
                      onClick={() => handleSubmit(query)}
                      className="w-full text-left hover:bg-muted/40 transition-colors"
                    >
                      <div className="px-3">
                        <TxRow
                          tx={{ ...tx, description: tx.description ?? '' }}
                          currency={currency}
                          locale={locale}
                        />
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => handleSubmit(query)}
                  className="mt-3 w-full rounded-xl border py-3 text-center text-xs-plus font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  Ver todos los resultados para &ldquo;{highlight(query, '')}&rdquo;
                </button>
              </div>
            )}

            {/* Buscar también en */}
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Buscar también en</p>
              <div className={cn('divide-y divide-border rounded-xl border bg-card overflow-hidden')}>
                {[
                  { label: 'Recurrentes', icon: RefreshCcw, href: '/recurring' },
                  { label: 'Presupuestos', icon: PieChart, href: '/budgets' },
                  { label: 'Metas', icon: Target, href: '/goals' },
                ].map(({ label, icon: Icon, href }) => (
                  <button
                    key={href}
                    type="button"
                    onClick={() => { onClose(); router.push(href) }}
                    className="flex w-full items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <Icon className="size-4 text-muted-foreground" strokeWidth={1.75} />
                    <span className="text-sm">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Empty / initial state */}
        {!showRecents && !showResults && !loading && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Escribí al menos 2 caracteres para buscar
          </p>
        )}
      </div>
    </div>
  )
}
