'use client'

import { useTransition } from 'react'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'
import type { DashboardStats } from '@/lib/supabase/queries/dashboard'
import { exportMonthlySummaryAction } from '@/app/(dashboard)/reports/actions'
import { downloadCsv } from '@/lib/utils/csv'

// Desktop-only recharts imports
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function fmt(v: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
}

interface Props {
  stats: DashboardStats | null
  currency: string
  locale: string
  year: number
  month: number
  onMonthChange: (year: number, month: number) => void
}

export function MonthlySummaryTab({ stats, currency, locale, year, month, onMonthChange }: Props) {
  const [, startExport] = useTransition()

  function navigate(delta: -1 | 1) {
    const d = new Date(year, month - 1 + delta, 1)
    onMonthChange(d.getFullYear(), d.getMonth() + 1)
  }

  function handleExport() {
    startExport(async () => {
      const res = await exportMonthlySummaryAction(year, month)
      if (!res.ok) { toast.error(res.error); return }
      downloadCsv(res.data, `fintrack-resumen-${year}-${String(month).padStart(2, '0')}.csv`)
    })
  }

  const savings = stats?.current_month.savings_rate ?? 0
  const prevSavings = stats && stats.previous_month.income > 0
    ? ((stats.previous_month.income - stats.previous_month.expenses) / stats.previous_month.income) * 100
    : 0
  const netResult = stats?.current_month.net ?? 0
  const catTotal = stats?.top_categories.reduce((s, c) => s + c.total, 0) ?? 1

  const monthLabel = `${MONTHS_ES[month - 1] ?? ''} ${year}`
  const monthShort = MONTHS_SHORT[month - 1] ?? ''

  return (
    <>
      {/* ── MOBILE layout ── */}
      <div className="lg:hidden space-y-4">
        {/* Period selector — small bordered square buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex size-8 items-center justify-center rounded-lg border bg-card text-foreground hover:bg-muted transition-colors"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <span className="text-sm font-semibold">{monthLabel}</span>
          <button
            onClick={() => navigate(1)}
            className="flex size-8 items-center justify-center rounded-lg border bg-card text-foreground hover:bg-muted transition-colors"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>

        {/* Dark hero card */}
        {stats && (
          <div className="rounded-2xl px-4 py-4 text-white" style={{ background: 'var(--foreground)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ opacity: 0.6 }}>Resultado del mes</p>
            <p className="mt-1 tabular-nums font-bold" style={{ fontSize: 30, letterSpacing: '-0.02em' }}>
              {netResult >= 0 ? '+' : ''}{fmt(netResult, currency, locale)}
            </p>
            <p className="text-xs mt-1" style={{ opacity: 0.7 }}>Ahorraste {savings.toFixed(1)}% de tus ingresos</p>

            <div className="mt-3.5 pt-3.5 grid grid-cols-2 gap-0" style={{ borderTop: '1px solid oklch(1 0 0 / 0.12)' }}>
              <div>
                <p style={{ fontSize: 10.5, opacity: 0.6 }}>Ingresos</p>
                <p className="mt-0.5 tabular-nums font-semibold" style={{ fontSize: 16 }}>{fmt(stats.current_month.income, currency, locale)}</p>
              </div>
              <div>
                <p style={{ fontSize: 10.5, opacity: 0.6 }}>Gastos</p>
                <p className="mt-0.5 tabular-nums font-semibold" style={{ fontSize: 16 }}>{fmt(stats.current_month.expenses, currency, locale)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Vs. mes anterior */}
        {stats && (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Vs. mes anterior</p>
            <div className="space-y-2">
              {[
                { l: 'Ingresos', curr: stats.current_month.income, prev: stats.previous_month.income, good: 'higher' },
                { l: 'Gastos',   curr: stats.current_month.expenses, prev: stats.previous_month.expenses, good: 'lower' },
                { l: 'Ahorro',   curr: netResult, prev: stats.previous_month.net, good: 'higher' },
              ].map(({ l, curr, prev, good }) => {
                const delta = prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : null
                const positive = delta !== null ? ((good === 'higher' && delta > 0) || (good === 'lower' && delta < 0)) : null
                return (
                  <div key={l} className="flex items-center gap-3 rounded-xl border bg-card px-3.5 py-3">
                    <div className="flex-1">
                      <p className="text-[13.5px] font-medium">{l}</p>
                      <p className="text-xs-plus text-muted-foreground tabular-nums">{fmt(prev, currency, locale)} en {monthShort} anterior</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[15px] font-semibold tabular-nums">{fmt(curr, currency, locale)}</p>
                      {delta !== null && (
                        <p className={`text-xs font-medium flex items-center justify-end gap-0.5 mt-0.5 ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                          {delta > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                          <span className="tabular-nums">{delta > 0 ? '+' : ''}{delta.toFixed(1)}%</span>
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Top expenses — numbered list */}
        {stats && stats.top_categories.length > 0 && (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Mayores gastos</p>
            <div className="rounded-xl border bg-card overflow-hidden divide-y divide-border">
              {stats.top_categories.slice(0, 5).map((cat, i) => (
                <div key={cat.id} className="flex items-center gap-3 px-3.5 py-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-[13px] font-bold text-muted-foreground">{i + 1}</span>
                  {cat.icon && <span className="text-base shrink-0">{cat.icon}</span>}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-medium truncate">{cat.name}</p>
                    <p className="text-xs-plus text-muted-foreground">{catTotal > 0 ? ((cat.total / catTotal) * 100).toFixed(0) : 0}% del total</p>
                  </div>
                  <p className="text-[13.5px] font-semibold tabular-nums shrink-0">−{fmt(cat.total, currency, locale)}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {!stats && (
          <div className="rounded-xl border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
            No hay datos para este período.
          </div>
        )}
      </div>

      {/* ── DESKTOP layout ── */}
      <div className="hidden lg:block space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="flex size-8 items-center justify-center rounded-lg border bg-card hover:bg-muted">
              <ChevronLeft className="size-3.5" />
            </button>
            <span className="text-sm font-semibold min-w-[140px] text-center">{monthLabel}</span>
            <button onClick={() => navigate(1)} className="flex size-8 items-center justify-center rounded-lg border bg-card hover:bg-muted">
              <ChevronRight className="size-3.5" />
            </button>
          </div>
          <button onClick={handleExport} className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted transition-colors">
            Exportar CSV
          </button>
        </div>

        {stats && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { title: 'Ingresos', curr: stats.current_month.income, prev: stats.previous_month.income },
                { title: 'Gastos', curr: stats.current_month.expenses, prev: stats.previous_month.expenses, invert: true },
                { title: 'Ahorro del mes', curr: netResult, prev: stats.previous_month.net },
                { title: 'Tasa de ahorro', curr: savings, prev: prevSavings, pct: true },
              ].map(({ title, curr, prev, invert, pct }) => {
                const delta = prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : null
                const positive = delta !== null ? (invert ? delta < 0 : delta > 0) : null
                return (
                  <div key={title} className="rounded-xl border bg-card p-4">
                    <p className="text-xs text-muted-foreground">{title}</p>
                    <p className="mt-1 text-xl font-bold tabular-nums">
                      {pct ? `${curr.toFixed(1)}%` : fmt(curr, currency, locale)}
                    </p>
                    {delta !== null && (
                      <p className={`mt-1 text-xs font-medium flex items-center gap-0.5 ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
                        {delta > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                        {delta > 0 ? '+' : ''}{delta.toFixed(1)}% vs mes anterior
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="rounded-xl border bg-card p-5">
              <h3 className="text-sm font-semibold mb-4">Ingresos vs Gastos</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[{ semana: 'Mes', Ingresos: stats.current_month.income, Gastos: stats.current_month.expenses }]}
                  margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="semana" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false}
                    tickFormatter={(v: number) => new Intl.NumberFormat(locale, { notation: 'compact', style: 'currency', currency, maximumFractionDigits: 0 }).format(v)} width={52} />
                  <Tooltip formatter={(v) => fmt(Number(v ?? 0), currency, locale)}
                    contentStyle={{ fontSize: 11, backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Ingresos" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Gastos" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {stats.top_categories.length > 0 && (
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b"><h3 className="text-sm font-semibold">Gastos por categoría</h3></div>
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
          </>
        )}

        {!stats && (
          <div className="rounded-xl border bg-card p-12 text-center text-sm text-muted-foreground">
            No hay datos para este período.
          </div>
        )}
      </div>
    </>
  )
}
