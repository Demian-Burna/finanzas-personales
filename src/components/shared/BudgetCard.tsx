'use client'

import { useState } from 'react'
import { MoreHorizontal, Edit, PowerOff, Power } from 'lucide-react'
import type { BudgetWithProgress } from '@/lib/supabase/queries/budgets'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

function formatCurrency(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function progressColor(pct: number): string {
  if (pct <= 60) return 'bg-emerald-500'
  if (pct <= 80) return 'bg-yellow-400'
  if (pct <= 100) return 'bg-orange-500'
  return 'bg-red-500'
}

function progressTextColor(pct: number): string {
  if (pct <= 60) return 'text-emerald-600 dark:text-emerald-400'
  if (pct <= 80) return 'text-yellow-600 dark:text-yellow-400'
  if (pct <= 100) return 'text-orange-600 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}

const PERIOD_LABEL: Record<string, string> = {
  monthly: 'Mensual',
  weekly: 'Semanal',
  yearly: 'Anual',
  custom: 'Personalizado',
}

interface Props {
  budget: BudgetWithProgress
  locale: string
  onEdit: (budget: BudgetWithProgress) => void
  onToggleActive: (id: string, isActive: boolean) => void
}

export function BudgetCard({ budget, locale, onEdit, onToggleActive }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)

  const currency = budget.currency_code
  const pct = budget.amount > 0 ? Math.round((budget.spent_amount / budget.amount) * 100) : 0
  const daysLeft = budget.days_in_period - budget.days_elapsed

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 shadow-sm transition-opacity',
        !budget.is_active && 'opacity-60',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {budget.category_icon && (
            <span className="text-lg shrink-0">{budget.category_icon}</span>
          )}
          {!budget.category_icon && budget.category_color && (
            <span
              className="size-3 shrink-0 rounded-full"
              style={{ background: budget.category_color }}
            />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{budget.category_name}</p>
            <p className="text-[10px] text-muted-foreground">
              {PERIOD_LABEL[budget.period_type] ?? budget.period_type}
              {!budget.is_active && ' · Inactivo'}
            </p>
          </div>
        </div>

        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors focus:outline-none"
            aria-label="Acciones"
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={() => { setMenuOpen(false); onEdit(budget) }}
              className="flex items-center gap-2"
            >
              <Edit className="size-3.5" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => { setMenuOpen(false); onToggleActive(budget.id, !budget.is_active) }}
              className="flex items-center gap-2"
            >
              {budget.is_active
                ? <><PowerOff className="size-3.5" /> Desactivar</>
                : <><Power className="size-3.5" /> Activar</>
              }
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">
            {formatCurrency(budget.spent_amount, currency, locale)} de {formatCurrency(budget.amount, currency, locale)}
          </span>
          <span className={cn('text-xs font-bold tabular-nums', progressTextColor(pct))}>
            {pct}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', progressColor(pct))}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2">
        <span>
          {daysLeft > 0
            ? `${daysLeft} día${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''}`
            : 'Período finalizado'}
        </span>
        {budget.projected_total > 0 && budget.days_elapsed > 0 && (
          <span className={cn(budget.projected_total > budget.amount ? 'text-orange-500' : '')}>
            Proyección: {formatCurrency(budget.projected_total, currency, locale)}
          </span>
        )}
      </div>
    </div>
  )
}

export function BudgetCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm animate-pulse space-y-3">
      <div className="flex items-center gap-2">
        <div className="size-4 rounded-full bg-muted shrink-0" />
        <div className="h-4 w-32 rounded bg-muted" />
      </div>
      <div className="h-2 rounded-full bg-muted" />
      <div className="flex justify-between">
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="h-3 w-10 rounded bg-muted" />
      </div>
    </div>
  )
}
