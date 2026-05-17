'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { AccountWithType } from '@/lib/supabase/queries/accounts'
import type { DashboardStats } from '@/lib/supabase/queries/dashboard'
import { exportNetWorthAction } from '@/app/(dashboard)/reports/actions'
import { downloadCsv } from '@/lib/utils/csv'
import { cn } from '@/lib/utils'

interface SnapshotRow {
  snapshot_date: string
  net_worth: number
  total_assets: number
  total_liabilities: number
}

interface Props {
  snapshots: SnapshotRow[]
  accounts: AccountWithType[]
  stats: DashboardStats | null
  currency: string
  locale: string
}

const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const PERIODS = ['6m', '1a', 'YTD', 'Todo'] as const
type Period = typeof PERIODS[number]

function fmtMonth(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return `${MONTHS_SHORT[d.getMonth()] ?? ''} ${String(d.getFullYear()).slice(2)}`
}

function fmt(v: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
}

export function NetWorthTab({ snapshots, accounts, stats, currency, locale }: Props) {
  const [period, setPeriod] = useState<Period>('6m')
  const [, startExport] = useTransition()

  function handleExport() {
    startExport(async () => {
      const res = await exportNetWorthAction()
      if (!res.ok) { toast.error(res.error); return }
      downloadCsv(res.data, 'fintrack-patrimonio-neto.csv')
    })
  }

  const assetAccounts = accounts.filter(a => a.account_type?.nature !== 'liability')
  const liabilityAccounts = accounts.filter(a => a.account_type?.nature === 'liability')

  const totalAssets = stats?.assets ?? assetAccounts.reduce((s, a) => s + a.current_balance, 0)
  const totalLiabilities = stats?.liabilities ?? liabilityAccounts.reduce((s, a) => s + a.current_balance, 0)
  const netWorth = stats?.net_worth ?? (totalAssets - totalLiabilities)

  // Filter snapshots by period
  const sliced = (() => {
    if (snapshots.length === 0) return snapshots
    if (period === '6m') return snapshots.slice(-6)
    if (period === '1a') return snapshots.slice(-12)
    if (period === 'YTD') {
      const yr = new Date().getFullYear()
      return snapshots.filter(s => s.snapshot_date.startsWith(String(yr)))
    }
    return snapshots
  })()

  // % change over selected period
  const firstSnap = sliced[0]
  const pctChange = firstSnap && firstSnap.net_worth > 0
    ? ((netWorth - firstSnap.net_worth) / firstSnap.net_worth) * 100
    : null

  // SVG line chart
  const pts = sliced.map((s, i) => ({ x: i, y: s.net_worth, m: fmtMonth(s.snapshot_date) }))
  const svgW = 320, svgH = 120
  const yMin = Math.min(...pts.map(p => p.y), 0)
  const yMax = Math.max(...pts.map(p => p.y), 1)
  const toX = (i: number) => pts.length > 1 ? 14 + (i / (pts.length - 1)) * (svgW - 28) : svgW / 2
  const toY = (v: number) => svgH - 14 - ((v - yMin) / (yMax - yMin || 1)) * (svgH - 28)
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.y)}`).join(' ')

  return (
    <>
      {/* ── MOBILE layout ── */}
      <div className="lg:hidden space-y-4">
        {/* Current value + period pills */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Patrimonio neto actual</p>
            <p className="text-2xl font-bold tabular-nums tracking-tight">{fmt(netWorth, currency, locale)}</p>
            {pctChange !== null && (
              <p className={cn('flex items-center gap-1 text-xs font-medium mt-1', pctChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400')}>
                {pctChange >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                <span className="tabular-nums">{pctChange >= 0 ? '+' : ''}{pctChange.toFixed(1)}%</span>
                <span className="text-muted-foreground font-normal">en {period}</span>
              </p>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            {PERIODS.map((p) => (
              <button key={p} type="button" onClick={() => setPeriod(p)}
                className="rounded-full px-2 py-1 text-[10.5px] font-medium transition-colors"
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
        </div>

        {/* SVG line chart */}
        {sliced.length > 1 ? (
          <div className="rounded-xl border bg-card p-3.5">
            <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" height={svgH}>
              <defs>
                <linearGradient id="nw-grad-m" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="var(--foreground)" stopOpacity="0.12" />
                  <stop offset="1" stopColor="var(--foreground)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0.25, 0.5, 0.75].map(t => {
                const y = svgH - 14 - t * (svgH - 28)
                return <line key={t} x1={14} x2={svgW - 14} y1={y} y2={y} stroke="var(--border)" strokeDasharray="2 4" />
              })}
              <path d={`${linePath} L ${toX(pts.length - 1)} ${svgH - 14} L ${toX(0)} ${svgH - 14} Z`} fill="url(#nw-grad-m)" />
              <path d={linePath} fill="none" stroke="var(--foreground)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              {pts.map((p, i) => (
                <circle key={i} cx={toX(i)} cy={toY(p.y)} r={i === pts.length - 1 ? 4 : 0} fill="var(--foreground)" />
              ))}
              {pts.map((p, i) => (
                <text key={i} x={toX(i)} y={svgH - 2} textAnchor="middle" fontSize={9} fill="var(--muted-foreground)" fontFamily="Inter">{p.m}</text>
              ))}
            </svg>
          </div>
        ) : (
          <div className="rounded-xl border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            El gráfico aparece cuando hay al menos 2 meses de datos.
          </div>
        )}

        {/* Activos breakdown */}
        {assetAccounts.length > 0 && (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Activos · {fmt(totalAssets, currency, locale)}
            </p>
            <div className="rounded-xl border bg-card overflow-hidden divide-y divide-border">
              {assetAccounts.map((a) => {
                const pct = totalAssets > 0 ? (a.current_balance / totalAssets) * 100 : 0
                return (
                  <div key={a.id} className="px-3.5 py-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-1.5 text-xs font-medium">
                        <span className="size-2 rounded-sm inline-block" style={{ background: a.color ?? 'var(--muted-foreground)' }} />
                        {a.name}
                      </span>
                      <span className="text-xs tabular-nums font-medium">{fmt(a.current_balance, a.currency_code, locale)}</span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: a.color ?? 'var(--foreground)' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Pasivos */}
        {liabilityAccounts.length > 0 && (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Pasivos · {fmt(totalLiabilities, currency, locale)}
            </p>
            <div className="rounded-xl border bg-card overflow-hidden divide-y divide-border">
              {liabilityAccounts.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-3.5 py-2.5">
                  <span className="flex items-center gap-1.5 text-xs font-medium">
                    <span className="size-2 rounded-sm bg-red-500 inline-block" />
                    {a.name}
                  </span>
                  <span className="text-xs tabular-nums font-medium text-red-500 dark:text-red-400">
                    −{fmt(Math.abs(a.current_balance), a.currency_code, locale)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── DESKTOP layout ── */}
      <div className="hidden lg:block space-y-6">
        <div className="flex justify-end">
          <button onClick={handleExport} className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted transition-colors">
            Exportar CSV
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Activos totales', value: totalAssets, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Pasivos totales', value: totalLiabilities, color: 'text-red-500 dark:text-red-400' },
            { label: 'Patrimonio neto', value: netWorth, color: netWorth >= 0 ? 'text-primary' : 'text-red-500 dark:text-red-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={cn('mt-1 text-xl font-bold tabular-nums', color)}>{fmt(value, currency, locale)}</p>
            </div>
          ))}
        </div>

        {snapshots.length > 1 && (
          <div className="rounded-xl border bg-card p-5">
            <h3 className="text-sm font-semibold mb-4">Evolución del patrimonio neto</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={snapshots.map(s => ({ month: fmtMonth(s.snapshot_date), 'Patrimonio neto': s.net_worth, Activos: s.total_assets, Pasivos: s.total_liabilities }))}
                margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={52}
                  tickFormatter={(v: number) => new Intl.NumberFormat(locale, { notation: 'compact', style: 'currency', currency, maximumFractionDigits: 0 }).format(v)} />
                <Tooltip formatter={(v) => fmt(Number(v ?? 0), currency, locale)}
                  contentStyle={{ fontSize: 11, backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="Activos" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Pasivos" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Patrimonio neto" stroke="#6366f1" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          {[
            { title: 'Activos', list: assetAccounts },
            { title: 'Pasivos', list: liabilityAccounts },
          ].map(({ title, list }) => (
            <div key={title} className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b"><h3 className="text-sm font-semibold">{title}</h3></div>
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
                        </td>
                        <td className="px-5 py-2 text-right tabular-nums font-medium">{fmt(a.current_balance, a.currency_code, locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
