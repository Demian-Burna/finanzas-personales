'use client'

import { useTransition } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import type { MonthlyFlowPoint } from '@/lib/supabase/queries/dashboard'
import { Button } from '@/components/ui/button'
import { exportCashFlowAction } from '@/app/(dashboard)/reports/actions'
import { downloadCsv } from '@/lib/utils/csv'

const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function fmtMonth(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return `${MONTHS_ES[d.getMonth()] ?? ''} ${String(d.getFullYear()).slice(2)}`
}

function fmt(v: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
}

// Simple linear projection for next 3 months
function project(flow: MonthlyFlowPoint[], months = 3): MonthlyFlowPoint[] {
  if (flow.length < 3) return []
  const last = flow.slice(-3)
  const avgIncome = last.reduce((s, p) => s + p.income, 0) / 3
  const avgExpenses = last.reduce((s, p) => s + p.expenses, 0) / 3

  const result: MonthlyFlowPoint[] = []
  const lastDate = new Date((flow[flow.length - 1]?.month_start ?? '') + 'T00:00:00')

  for (let i = 1; i <= months; i++) {
    const d = new Date(lastDate.getFullYear(), lastDate.getMonth() + i, 1)
    const monthStart = d.toISOString().split('T')[0] ?? ''
    result.push({
      month_start: monthStart,
      income: Math.round(avgIncome),
      expenses: Math.round(avgExpenses),
      net: Math.round(avgIncome - avgExpenses),
    })
  }
  return result
}

interface Props {
  flow: MonthlyFlowPoint[]
  currency: string
  locale: string
}

export function CashFlowTab({ flow, currency, locale }: Props) {
  const [exporting, startExport] = useTransition()

  function handleExport() {
    startExport(async () => {
      const res = await exportCashFlowAction()
      if (!res.ok) { toast.error(res.error); return }
      downloadCsv(res.data, 'fintrack-flujo-de-caja.csv')
    })
  }

  const projected = project(flow)

  const historicData = flow.map((p) => ({
    month: fmtMonth(p.month_start),
    Ingresos: p.income,
    Gastos: p.expenses,
    Neto: p.net,
    projected: false,
  }))

  const projectedData = projected.map((p) => ({
    month: fmtMonth(p.month_start) + ' (p)',
    Ingresos: p.income,
    Gastos: p.expenses,
    Neto: p.net,
    projected: true,
  }))

  const chartData = [...historicData, ...projectedData]

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting} className="gap-1.5">
          <Download className="size-3.5" />Exportar CSV
        </Button>
      </div>

      {/* Area chart */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold mb-1">Flujo de caja — últimos 12 meses</h3>
        <p className="text-xs text-muted-foreground mb-4">Los meses marcados con (p) son proyecciones basadas en promedios</p>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
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
            <Area type="monotone" dataKey="Ingresos" stroke="var(--chart-2)" fill="url(#cf-income)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="Gastos" stroke="var(--chart-1)" fill="url(#cf-expenses)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="Neto" stroke="var(--chart-3)" fill="none" strokeWidth={2} dot={false} strokeDasharray="4 2" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b">
          <h3 className="text-sm font-semibold">Tabla mensual</h3>
        </div>
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
                  <td className={`px-5 py-2 text-right tabular-nums font-semibold ${p.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                    {fmt(p.net, currency, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
