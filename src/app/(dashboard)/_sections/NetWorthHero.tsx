import { TrendingUp, TrendingDown } from 'lucide-react'
import type { DashboardStats } from '@/lib/supabase/queries/dashboard'

interface Props {
  data: DashboardStats | null
  currency: string
  locale: string
}

function fmt(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function fmtCompact(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation: 'compact',
  }).format(value)
}

export function NetWorthHero({ data, currency, locale }: Props) {
  if (!data) return <NetWorthHeroSkeleton />

  // % of net worth saved/lost this month
  const monthlyPct =
    data.net_worth > 0 ? (data.current_month.net / data.net_worth) * 100 : null
  const isPositive = monthlyPct != null ? monthlyPct >= 0 : null
  const savingsRate = data.current_month.savings_rate

  return (
    <div
      className="lg:hidden rounded-2xl px-5 py-5 text-white"
      style={{
        background: 'linear-gradient(155deg, oklch(0.20 0 0), oklch(0.13 0 0))',
        boxShadow: '0 2px 12px oklch(0 0 0 / 0.25)',
      }}
    >
      {/* Label + pill */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
          Patrimonio neto
        </span>

        {monthlyPct != null && (
          <span
            className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{
              background: isPositive
                ? 'oklch(0.58 0.13 155 / 0.25)'
                : 'oklch(0.577 0.245 27.325 / 0.25)',
              color: isPositive ? 'oklch(0.78 0.13 155)' : 'oklch(0.8 0.18 27)',
            }}
          >
            {isPositive ? (
              <TrendingUp className="size-3" strokeWidth={2} />
            ) : (
              <TrendingDown className="size-3" strokeWidth={2} />
            )}
            {monthlyPct > 0 ? '+' : ''}
            {monthlyPct.toFixed(1)}% este mes
          </span>
        )}
      </div>

      {/* Big amount */}
      <p
        className="mt-2 tabular-nums leading-none"
        style={{ fontSize: '34px', fontWeight: 700, letterSpacing: '-0.02em' }}
      >
        {fmt(data.net_worth, currency, locale)}
      </p>

      {/* Divider */}
      <div className="my-4 h-px bg-white/10" />

      {/* 3-column summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-white/50">Ingresos</span>
          <span className="text-xs-plus font-semibold tabular-nums text-white/90">
            {fmtCompact(data.current_month.income, currency, locale)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-white/50">Gastos</span>
          <span className="text-xs-plus font-semibold tabular-nums text-white/90">
            {fmtCompact(data.current_month.expenses, currency, locale)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-white/50">Ahorro</span>
          <span className="text-xs-plus font-semibold tabular-nums text-white/90">
            {savingsRate.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  )
}

export function NetWorthHeroSkeleton() {
  return (
    <div
      className="lg:hidden rounded-2xl px-5 py-5 animate-pulse"
      style={{ background: 'linear-gradient(155deg, oklch(0.20 0 0), oklch(0.13 0 0))' }}
    >
      <div className="h-3 w-32 rounded bg-white/10" />
      <div className="mt-3 h-9 w-48 rounded bg-white/10" />
      <div className="my-4 h-px bg-white/10" />
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-2.5 w-12 rounded bg-white/10" />
            <div className="h-3 w-16 rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  )
}
