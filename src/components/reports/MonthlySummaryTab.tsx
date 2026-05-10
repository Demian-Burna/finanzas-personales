'use client'

import { useTransition } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'
import { Download, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { toast } from 'sonner'
import type { DashboardStats } from '@/lib/supabase/queries/dashboard'
import { Button } from '@/components/ui/button'
import { exportMonthlySummaryAction } from '@/app/(dashboard)/reports/actions'
import { downloadCsv } from '@/lib/utils/csv'

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function fmt(v: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
}

function pctChange(curr: number, prev: number) {
  if (prev === 0) return null
  return ((curr - prev) / Math.abs(prev)) * 100
}

function Delta({ curr, prev, invert = false }: { curr: number; prev: number; invert?: boolean }) {
  const pct = pctChange(curr, prev)
  if (pct === null) return null
  const isGood = invert ? pct < 0 : pct > 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isGood ? 'text-emerald-600 dark:text-emerald-400' : pct === 0 ? 'text-muted-foreground' : 'text-red-500 dark:text-red-400'}`}>
      {pct === 0 ? <Minus className="size-3" /> : pct > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
    </span>
  )
}

interface Props {
  stats: DashboardStats | null
  currency: string
  locale: string
  year: number
  month: number
  onMonthChange: (year: number, month: number) => void
}

// Build weekly bar data from stats (simplified — 4 equal weeks)
function buildWeeklyData(stats: DashboardStats | null) {
  if (!stats) return []
  // Without week-level granularity from the RPC, show a single month bar
  return [
    {
      semana: 'Mes',
      Ingresos: stats.current_month.income,
      Gastos: stats.current_month.expenses,
    },
  ]
}

export function MonthlySummaryTab({ stats, currency, locale, year, month, onMonthChange }: Props) {
  const [exporting, startExport] = useTransition()

  function handleExport() {
    startExport(async () => {
      const res = await exportMonthlySummaryAction(year, month)
      if (!res.ok) { toast.error(res.error); return }
      downloadCsv(res.data, `fintrack-resumen-${year}-${String(month).padStart(2, '0')}.csv`)
    })
  }

  function navigate(delta: -1 | 1) {
    const d = new Date(year, month - 1 + delta, 1)
    onMonthChange(d.getFullYear(), d.getMonth() + 1)
  }

  // RPC already returns savings_rate as a percentage (e.g. 72.9 = 72.9%)
  const savings = stats ? stats.current_month.savings_rate : 0
  const prevSavings = stats && stats.previous_month.income > 0
    ? ((stats.previous_month.income - stats.previous_month.expenses) / stats.previous_month.income) * 100
    : 0

  const weeklyData = buildWeeklyData(stats)

  const catTotal = stats?.top_categories.reduce((s, c) => s + c.total, 0) ?? 1

  return (
    <div className="space-y-6">
      {/* Period selector + export */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>‹</Button>
          <span className="text-sm font-semibold min-w-[140px] text-center">
            {MONTHS_ES[month - 1]} {year}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={() => navigate(1)}>›</Button>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting} className="gap-1.5">
          <Download className="size-3.5" />
          Exportar CSV
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: 'Ingresos', curr: stats?.current_month.income ?? 0, prev: stats?.previous_month.income ?? 0 },
          { title: 'Gastos', curr: stats?.current_month.expenses ?? 0, prev: stats?.previous_month.expenses ?? 0, invert: true },
          { title: 'Balance neto', curr: stats?.current_month.net ?? 0, prev: stats?.previous_month.net ?? 0 },
          { title: 'Tasa de ahorro', curr: savings, prev: prevSavings, pct: true },
        ].map(({ title, curr, prev, invert, pct }) => (
          <div key={title} className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="mt-1 text-xl font-bold tabular-nums">
              {pct ? `${curr.toFixed(1)}%` : fmt(curr, currency, locale)}
            </p>
            <div className="mt-1"><Delta curr={curr} prev={prev} invert={invert} /></div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      {stats && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-4">Ingresos vs Gastos</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="semana" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} tickFormatter={(v: number) =>
                new Intl.NumberFormat(locale, { notation: 'compact', style: 'currency', currency, maximumFractionDigits: 0 }).format(v)} width={52} />
              <Tooltip
                formatter={(v) => fmt(Number(v ?? 0), currency, locale)}
                contentStyle={{
                  fontSize: 11,
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--foreground)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: 'var(--foreground)' }} />
              <Bar dataKey="Ingresos" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Gastos" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category table */}
      {stats && stats.top_categories.length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b">
            <h3 className="text-sm font-semibold">Gastos por categoría</h3>
          </div>
          <table className="w-full text-xs">
            <thead className="border-b text-muted-foreground">
              <tr>
                <th className="px-5 py-2 text-left font-medium">Categoría</th>
                <th className="px-5 py-2 text-right font-medium">Monto</th>
                <th className="px-5 py-2 text-right font-medium">% total</th>
              </tr>
            </thead>
            <tbody>
              {stats.top_categories.map((cat) => (
                <tr key={cat.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-5 py-2 flex items-center gap-2">
                    {cat.icon && <span>{cat.icon}</span>}
                    <span style={{ color: cat.color ?? undefined }}>{cat.name}</span>
                  </td>
                  <td className="px-5 py-2 text-right tabular-nums">{fmt(cat.total, currency, locale)}</td>
                  <td className="px-5 py-2 text-right tabular-nums text-muted-foreground">
                    {catTotal > 0 ? ((cat.total / catTotal) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!stats && (
        <div className="rounded-xl border bg-card p-12 text-center text-sm text-muted-foreground shadow-sm">
          No hay datos para este período.
        </div>
      )}
    </div>
  )
}
