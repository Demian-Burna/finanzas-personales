'use client'

import { useTransition } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import type { AccountWithType } from '@/lib/supabase/queries/accounts'
import type { DashboardStats } from '@/lib/supabase/queries/dashboard'
import { Button } from '@/components/ui/button'
import { exportNetWorthAction } from '@/app/(dashboard)/reports/actions'
import { downloadCsv } from '@/lib/utils/csv'

interface SnapshotRow {
  snapshot_date: string
  net_worth: number
  total_assets: number
  total_liabilities: number
}

interface Props {
  snapshots: SnapshotRow[]
  accounts: AccountWithType[]
  /** RPC stats — already has currency-converted net_worth/assets/liabilities */
  stats: DashboardStats | null
  currency: string
  locale: string
}

const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function fmtMonth(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return `${MONTHS_ES[d.getMonth()] ?? ''} ${String(d.getFullYear()).slice(2)}`
}

function fmt(v: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(v)
}

export function NetWorthTab({ snapshots, accounts, stats, currency, locale }: Props) {
  const [exporting, startExport] = useTransition()

  function handleExport() {
    startExport(async () => {
      const res = await exportNetWorthAction()
      if (!res.ok) { toast.error(res.error); return }
      downloadCsv(res.data, 'fintrack-patrimonio-neto.csv')
    })
  }

  const assetAccounts = accounts.filter((a) => a.account_type?.nature !== 'liability')
  const liabilityAccounts = accounts.filter((a) => a.account_type?.nature === 'liability')

  // Use RPC values — they convert all currencies to base currency via exchange_rate_cache.
  // Fallback to simple sum (no conversion) only when stats are unavailable.
  const totalAssets = stats?.assets
    ?? assetAccounts.reduce((s, a) => s + a.current_balance, 0)
  const totalLiabilities = stats?.liabilities
    ?? liabilityAccounts.reduce((s, a) => s + a.current_balance, 0)
  const netWorth = stats?.net_worth ?? (totalAssets - totalLiabilities)

  const chartData = snapshots.map((s) => ({
    month: fmtMonth(s.snapshot_date),
    'Patrimonio neto': s.net_worth,
    Activos: s.total_assets,
    Pasivos: s.total_liabilities,
  }))

  const waterfallData = [
    { name: 'Activos',    value: totalAssets,      fill: '#10b981' },
    { name: 'Pasivos',    value: -totalLiabilities, fill: '#ef4444' },
    { name: 'Patrimonio', value: netWorth,          fill: '#6366f1' },
  ]

  const tooltipStyle = {
    fontSize: 11,
    backgroundColor: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--foreground)',
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting} className="gap-1.5">
          <Download className="size-3.5" />Exportar CSV
        </Button>
      </div>

      {/* Summary cards — values come from RPC (currency-converted) */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Activos totales',  value: totalAssets,      color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Pasivos totales',  value: totalLiabilities, color: 'text-red-500 dark:text-red-400' },
          { label: 'Patrimonio neto',  value: netWorth,         color: netWorth >= 0 ? 'text-primary' : 'text-red-500 dark:text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border bg-card p-4 shadow-sm text-center">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`mt-1 text-xl font-bold tabular-nums ${color}`}>{fmt(value, currency, locale)}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">En {currency}</p>
          </div>
        ))}
      </div>

      {/* Line chart evolution */}
      {snapshots.length > 1 && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-4">Evolución del patrimonio neto</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                tickLine={false} axisLine={false} width={52}
                tickFormatter={(v: number) =>
                  new Intl.NumberFormat(locale, { notation: 'compact', style: 'currency', currency, maximumFractionDigits: 0 }).format(v)
                }
              />
              <Tooltip formatter={(v) => fmt(Number(v ?? 0), currency, locale)} contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="Activos" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Pasivos" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Patrimonio neto" stroke="#6366f1" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {snapshots.length <= 1 && (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
          El gráfico de evolución aparecerá cuando haya al menos 2 meses de datos.
        </div>
      )}

      {/* Waterfall / breakdown */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold mb-1">Desglose actual</h3>
        <p className="text-xs text-muted-foreground mb-4">Valores convertidos a {currency} usando tasas de cambio actuales</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={waterfallData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickLine={false} axisLine={false} width={52}
              tickFormatter={(v: number) =>
                new Intl.NumberFormat(locale, { notation: 'compact', style: 'currency', currency, maximumFractionDigits: 0 }).format(v)
              }
            />
            <Tooltip formatter={(v) => fmt(Math.abs(Number(v ?? 0)), currency, locale)} contentStyle={tooltipStyle} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {waterfallData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Accounts breakdown — each account shown in its native currency */}
      <div className="grid gap-4 lg:grid-cols-2">
        {[
          { title: 'Activos', list: assetAccounts },
          { title: 'Pasivos', list: liabilityAccounts },
        ].map(({ title, list }) => (
          <div key={title} className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b">
              <h3 className="text-sm font-semibold">{title}</h3>
            </div>
            {list.length === 0 ? (
              <p className="px-5 py-4 text-xs text-muted-foreground">Sin cuentas de este tipo.</p>
            ) : (
              <table className="w-full text-xs">
                <tbody>
                  {list.map((a) => (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-5 py-2 flex items-center gap-2">
                        <span className="size-2 rounded-full shrink-0" style={{ background: a.color ?? 'var(--muted-foreground)' }} />
                        <span>{a.name}</span>
                        {a.currency_code !== currency && (
                          <span className="ml-auto text-muted-foreground/60">{a.currency_code}</span>
                        )}
                      </td>
                      <td className="px-5 py-2 text-right tabular-nums font-medium">
                        {fmt(a.current_balance, a.currency_code, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
