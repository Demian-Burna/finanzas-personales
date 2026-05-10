'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { MonthlyFlowPoint } from '@/lib/supabase/queries/dashboard'

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function formatMonth(isoDate: string) {
  const d = new Date(isoDate + 'T00:00:00')
  return `${MONTHS_ES[d.getMonth()] ?? ''} ${String(d.getFullYear()).slice(2)}`
}

function formatCurrency(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

interface Props {
  data: MonthlyFlowPoint[]
  currency: string
  locale: string
}

interface TooltipPayloadItem {
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

function CustomTooltip({ active, payload, label, currency, locale }: CustomTooltipProps & { currency: string; locale: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg text-xs space-y-1">
      <p className="font-semibold text-foreground">{label}</p>
      {payload.map((item) => (
        <div key={item.name} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: item.color }} />
          <span className="text-muted-foreground capitalize">{item.name}:</span>
          <span className="font-medium">{formatCurrency(item.value, currency, locale)}</span>
        </div>
      ))}
    </div>
  )
}

export function FlowChart({ data, currency, locale }: Props) {
  const chartData = data.map((p) => ({
    month: formatMonth(p.month_start),
    Ingresos: p.income,
    Gastos: p.expenses,
    Neto: p.net,
  }))

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-foreground mb-4">Flujo mensual (últimos 6 meses)</h2>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradNet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.2} />
              <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) =>
              new Intl.NumberFormat(locale, { notation: 'compact', currency, style: 'currency', maximumFractionDigits: 0 }).format(v)
            }
            width={52}
          />
          <Tooltip content={<CustomTooltip currency={currency} locale={locale} />} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8, color: 'hsl(var(--foreground))' }} />
          <Area type="monotone" dataKey="Ingresos" stroke="hsl(var(--chart-2))" fill="url(#gradIncome)" strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="Gastos" stroke="hsl(var(--chart-1))" fill="url(#gradExpenses)" strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="Neto" stroke="hsl(var(--chart-3))" fill="url(#gradNet)" strokeWidth={2} dot={false} strokeDasharray="4 2" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function FlowChartSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm animate-pulse">
      <div className="h-4 w-48 rounded bg-muted mb-4" />
      <div className="h-[240px] rounded bg-muted" />
    </div>
  )
}
