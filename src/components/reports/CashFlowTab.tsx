'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { MonthlyFlowPoint } from '@/lib/supabase/queries/dashboard'
import { exportCashFlowAction } from '@/app/(dashboard)/reports/actions'
import { downloadCsv } from '@/lib/utils/csv'
import { cn } from '@/lib/utils'

const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function fmtMonth(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return `${MONTHS_SHORT[d.getMonth()] ?? ''} ${String(d.getFullYear()).slice(2)}`
}

function fmt(v: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
}

const PERIODS = ['3m', '6m', '12m', 'Año'] as const
type Period = typeof PERIODS[number]

interface Props {
  flow: MonthlyFlowPoint[]
  currency: string
  locale: string
}

export function CashFlowTab({ flow, currency, locale }: Props) {
  const [period, setPeriod] = useState<Period>('6m')
  const [, startExport] = useTransition()

  function handleExport() {
    startExport(async () => {
      const res = await exportCashFlowAction()
      if (!res.ok) { toast.error(res.error); return }
      downloadCsv(res.data, 'fintrack-flujo-de-caja.csv')
    })
  }

  // Filter data by period
  const sliced = (() => {
    if (period === '3m') return flow.slice(-3)
    if (period === '6m') return flow.slice(-6)
    if (period === '12m') return flow.slice(-12)
    return flow // Año = all
  })()

  const totalIncome = sliced.reduce((s, p) => s + p.income, 0)
  const totalExpenses = sliced.reduce((s, p) => s + p.expenses, 0)
  const totalNet = totalIncome - totalExpenses

  // SVG bar chart data
  const max = Math.max(...sliced.flatMap(d => [d.income, d.expenses]), 1)

  return (
    <>
      {/* ── MOBILE layout ── */}
      <div className="lg:hidden space-y-4">
        {/* Period pills + legend */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className="rounded-full px-2.5 py-1 text-[11.5px] font-medium transition-colors"
                style={{
                  border: `1px solid ${period === p ? 'var(--foreground)' : 'var(--border)'}`,
                  background: period === p ? 'var(--foreground)' : 'var(--card)',
                  color: period === p ? 'var(--background)' : 'var(--muted-foreground)',
                }}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm inline-block" style={{ background: 'var(--success)' }} />In
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm inline-block" style={{ background: 'var(--danger)' }} />Out
            </span>
          </div>
        </div>

        {/* Net summary card + bar chart */}
        <div className="rounded-xl border bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Flujo neto · últimos {period}</p>
          <p className={cn('text-2xl font-bold tabular-nums tracking-tight', totalNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400')}>
            {totalNet >= 0 ? '+' : ''}{fmt(totalNet, currency, locale)}
          </p>
          <p className="text-xs-plus text-muted-foreground mt-0.5">
            {fmt(totalIncome, currency, locale)} entraron · {fmt(totalExpenses, currency, locale)} salieron
          </p>

          {/* SVG paired bar chart */}
          <div className="mt-4">
            <svg viewBox="0 0 320 110" width="100%" height={110}>
              {sliced.map((d, i) => {
                const bw = 16
                const totalW = sliced.length * (bw * 2 + 8)
                const startX = (320 - totalW) / 2 + i * (bw * 2 + 8)
                const hi = max > 0 ? (d.income / max) * 90 : 0
                const he = max > 0 ? (d.expenses / max) * 90 : 0
                return (
                  <g key={i}>
                    <rect x={startX} y={90 - hi} width={bw} height={hi} rx={3} fill="var(--success)" />
                    <rect x={startX + bw + 2} y={90 - he} width={bw} height={he} rx={3} fill="var(--danger)" opacity={0.85} />
                    <text x={startX + bw} y={104} textAnchor="middle" fontSize={9} fill="var(--muted-foreground)" fontFamily="Inter">
                      {fmtMonth(d.month_start).split(' ')[0]}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </div>

        {/* Month-by-month table */}
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Detalle</p>
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="grid px-3.5 py-2 border-b bg-muted/30" style={{ gridTemplateColumns: '52px 1fr 1fr 80px' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Mes</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ingresos</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Gastos</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Neto</p>
          </div>
          {[...sliced].reverse().map((p, i) => {
            const net = p.income - p.expenses
            return (
              <div key={p.month_start} className={cn('grid items-center px-3.5 py-2.5', i < sliced.length - 1 && 'border-b border-border')} style={{ gridTemplateColumns: '52px 1fr 1fr 80px' }}>
                <p className="text-xs font-semibold">{fmtMonth(p.month_start)}</p>
                <p className="text-xs tabular-nums" style={{ color: 'var(--success)' }}>+{fmt(p.income, currency, locale)}</p>
                <p className="text-xs tabular-nums" style={{ color: 'var(--danger)' }}>−{fmt(p.expenses, currency, locale)}</p>
                <p className={cn('text-[13px] font-semibold tabular-nums text-right', net >= 0 ? 'text-foreground' : 'text-red-500 dark:text-red-400')}>
                  {net >= 0 ? '+' : '−'}{fmt(Math.abs(net), currency, locale)}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── DESKTOP layout ── */}
      <div className="hidden lg:block space-y-6">
        <div className="flex justify-end">
          <button onClick={handleExport} className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted transition-colors">
            Exportar CSV
          </button>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Flujo de caja — últimos 12 meses</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={flow.map(p => ({ month: fmtMonth(p.month_start), Ingresos: p.income, Gastos: p.expenses, Neto: p.net }))}
              margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="cf-income" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cf-expenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={52}
                tickFormatter={(v: number) => new Intl.NumberFormat(locale, { notation: 'compact', style: 'currency', currency, maximumFractionDigits: 0 }).format(v)} />
              <Tooltip formatter={(v) => fmt(Number(v ?? 0), currency, locale)}
                contentStyle={{ fontSize: 11, backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="Ingresos" stroke="var(--chart-2)" fill="url(#cf-income)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="Gastos" stroke="var(--chart-1)" fill="url(#cf-expenses)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="Neto" stroke="var(--chart-3)" fill="none" strokeWidth={2} dot={false} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b"><h3 className="text-sm font-semibold">Tabla mensual</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b text-muted-foreground">
                <tr>
                  <th className="px-5 py-2 text-left font-medium">Mes</th>
                  <th className="px-5 py-2 text-right font-medium">Ingresos</th>
                  <th className="px-5 py-2 text-right font-medium">Gastos</th>
                  <th className="px-5 py-2 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {[...flow].reverse().map((p) => (
                  <tr key={p.month_start} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-2">{fmtMonth(p.month_start)}</td>
                    <td className="px-5 py-2 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{fmt(p.income, currency, locale)}</td>
                    <td className="px-5 py-2 text-right tabular-nums text-red-500 dark:text-red-400">{fmt(p.expenses, currency, locale)}</td>
                    <td className={cn('px-5 py-2 text-right tabular-nums font-semibold', p.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400')}>
                      {fmt(p.net, currency, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
