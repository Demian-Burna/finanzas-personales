'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useCountUp } from '@/hooks/useCountUp'
import { cn } from '@/lib/utils'

interface Props {
  title: string
  subtitle?: string
  value: number
  previousValue?: number
  currency: string
  locale: string
  /** If true, lower values are better (e.g. expenses) */
  invertTrend?: boolean
  /** If true, format as percentage instead of currency */
  isPercentage?: boolean
  className?: string
}

function formatCurrency(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPercent(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

export function StatCard({ title, subtitle, value, previousValue, currency, locale, invertTrend, isPercentage, className }: Props) {
  const animated = useCountUp(value)

  const pctChange =
    previousValue != null && previousValue !== 0
      ? ((value - previousValue) / Math.abs(previousValue)) * 100
      : null

  const isPositive = pctChange != null ? (invertTrend ? pctChange < 0 : pctChange > 0) : null

  return (
    <div className={cn('rounded-xl border bg-card p-5 shadow-sm', className)}>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {subtitle && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{subtitle}</p>}
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight">
        {isPercentage ? formatPercent(animated, locale) : formatCurrency(animated, currency, locale)}
      </p>

      {pctChange != null && (
        <div
          className={cn(
            'mt-2 flex items-center gap-1 text-xs font-medium',
            isPositive === true && 'text-emerald-600 dark:text-emerald-400',
            isPositive === false && 'text-red-500 dark:text-red-400',
            isPositive === null && 'text-muted-foreground',
          )}
        >
          {pctChange === 0 ? (
            <Minus className="size-3" />
          ) : pctChange > 0 ? (
            <TrendingUp className="size-3" />
          ) : (
            <TrendingDown className="size-3" />
          )}
          <span>
            {pctChange > 0 ? '+' : ''}
            {pctChange.toFixed(1)}% vs mes anterior
          </span>
        </div>
      )}
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm animate-pulse">
      <div className="h-4 w-32 rounded bg-muted" />
      <div className="mt-2 h-8 w-40 rounded bg-muted" />
      <div className="mt-2 h-3 w-24 rounded bg-muted" />
    </div>
  )
}
