'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { DashboardStats } from '@/lib/supabase/queries/dashboard'

type Category = DashboardStats['top_categories'][number]

const FALLBACK_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
]

function formatCurrency(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

interface Props {
  categories: Category[]
  currency: string
  locale: string
}

interface TooltipPayloadItem {
  name: string
  value: number
  payload: { color: string | null }
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
}

function CustomTooltip({ active, payload, currency, locale }: CustomTooltipProps & { currency: string; locale: string }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  if (!item) return null
  return (
    <div className="rounded-lg border bg-background p-2.5 shadow-lg text-xs">
      <p className="font-semibold">{item.name}</p>
      <p className="text-muted-foreground">{formatCurrency(item.value, currency, locale)}</p>
    </div>
  )
}

export function CategoryDonut({ categories, currency, locale }: Props) {
  const total = categories.reduce((sum, c) => sum + c.total, 0)

  const data = categories.map((c, i) => ({
    name: c.name,
    value: c.total,
    color: c.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length] ?? '#6366f1',
    icon: c.icon,
  }))

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-foreground mb-4">Gastos por categoría</h2>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* Donut */}
        <div className="mx-auto w-full max-w-[180px] shrink-0">
          <ResponsiveContainer width="100%" aspect={1}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="85%"
                paddingAngle={2}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip currency={currency} locale={locale} />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* List */}
        <ul className="flex-1 space-y-2 min-w-0">
          {data.map((cat) => {
            const pct = total > 0 ? (cat.value / total) * 100 : 0
            return (
              <li key={cat.name} className="flex items-center gap-2 text-xs min-w-0">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: cat.color }} />
                <span className="truncate flex-1 text-foreground">{cat.name}</span>
                <span className="tabular-nums text-muted-foreground shrink-0">{pct.toFixed(0)}%</span>
                <span className="tabular-nums font-medium shrink-0">
                  {formatCurrency(cat.value, currency, locale)}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export function CategoryDonutSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm animate-pulse">
      <div className="h-4 w-40 rounded bg-muted mb-4" />
      <div className="flex gap-4">
        <div className="size-[140px] shrink-0 rounded-full bg-muted" />
        <div className="flex-1 space-y-2 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3 rounded bg-muted" />
          ))}
        </div>
      </div>
    </div>
  )
}
