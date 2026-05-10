'use client'

import { useState, useTransition } from 'react'
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts'
import { Download, ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { exportCategoryBreakdownAction } from '@/app/(dashboard)/reports/actions'
import { downloadCsv } from '@/lib/utils/csv'
import { createClient } from '@/lib/supabase/client'
import { getTransactions } from '@/lib/supabase/queries/transactions'

type Period = 'month' | 'quarter' | 'year'

const FALLBACK_COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316','#84cc16','#06b6d4']

function getRange(period: Period): { from: string; to: string } {
  const now = new Date()
  const to = now.toISOString().split('T')[0] ?? ''
  if (period === 'month') {
    const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    return { from, to }
  }
  if (period === 'quarter') {
    const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
    return { from: qStart.toISOString().split('T')[0] ?? '', to }
  }
  return { from: `${now.getFullYear()}-01-01`, to }
}

function fmt(v: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
}

interface CategoryRow {
  id: string
  name: string
  total: number
  count: number
  color: string
}

interface Props {
  currency: string
  locale: string
}

export function CategoryBreakdownTab({ currency, locale }: Props) {
  const [period, setPeriod] = useState<Period>('month')
  const [rows, setRows] = useState<CategoryRow[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [drillCat, setDrillCat] = useState<CategoryRow | null>(null)
  const [exporting, startExport] = useTransition()

  async function load(p: Period) {
    setLoading(true)
    setDrillCat(null)
    const { from, to } = getRange(p)
    const supabase = createClient()
    const { data: txs } = await getTransactions(supabase, {
      type: 'expense', dateFrom: from, dateTo: to, pageSize: 1000,
    })

    const map: Record<string, { name: string; total: number; count: number; color: string | null; catId: string }> = {}
    for (const tx of txs) {
      const key = tx.category?.id ?? '__none__'
      if (!map[key]) {
        map[key] = {
          catId: key,
          name: tx.category?.name ?? 'Sin categoría',
          total: 0,
          count: 0,
          color: tx.category?.color ?? null,
        }
      }
      map[key]!.total += tx.amount
      map[key]!.count++
    }

    const result: CategoryRow[] = Object.entries(map)
      .map(([id, v], i) => ({
        id,
        name: v.name,
        total: v.total,
        count: v.count,
        color: v.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length] ?? '#6366f1',
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    setRows(result)
    setLoaded(true)
    setLoading(false)
  }

  function handlePeriod(p: Period) {
    setPeriod(p)
    void load(p)
  }

  function handleExport() {
    const { from, to } = getRange(period)
    startExport(async () => {
      const res = await exportCategoryBreakdownAction(from, to)
      if (!res.ok) { toast.error(res.error); return }
      downloadCsv(res.data, `fintrack-categorias-${period}.csv`)
    })
  }

  const total = rows.reduce((s, r) => s + r.total, 0)

  const treemapData = rows.map((r) => ({ name: r.name, size: r.total, color: r.color }))

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 rounded-lg border p-1">
          {(['month', 'quarter', 'year'] as const).map((p) => (
            <button key={p} onClick={() => handlePeriod(p)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${period === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {p === 'month' ? 'Mes' : p === 'quarter' ? 'Trimestre' : 'Año'}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting || !loaded} className="gap-1.5">
          <Download className="size-3.5" />Exportar CSV
        </Button>
      </div>

      {!loaded && !loading && (
        <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
          <Button onClick={() => void load(period)} size="sm">Cargar datos</Button>
        </div>
      )}

      {loading && (
        <div className="h-64 rounded-xl border bg-card animate-pulse" />
      )}

      {loaded && !loading && (
        <>
          {/* Drill-down header */}
          {drillCat && (
            <button onClick={() => setDrillCat(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ChevronLeft className="size-4" /> Volver a todas las categorías
            </button>
          )}

          {/* Treemap */}
          {!drillCat && rows.length > 0 && (
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-semibold mb-4">Distribución de gastos</h3>
              <ResponsiveContainer width="100%" height={280}>
                <Treemap
                  data={treemapData}
                  dataKey="size"
                  stroke="hsl(var(--background))"
                  content={({ x, y, width, height, name, color }: {
                    x?: number; y?: number; width?: number; height?: number; name?: string; color?: string
                  }) => {
                    if (!width || !height || width < 30 || height < 20) return <g />
                    return (
                      <g>
                        <rect x={x} y={y} width={width} height={height} style={{ fill: color ?? '#6366f1', stroke: 'hsl(var(--background))', strokeWidth: 2, cursor: 'pointer' }} />
                        {width > 60 && height > 30 && (
                          <text x={(x ?? 0) + 8} y={(y ?? 0) + 20} fill="#fff" fontSize={11} fontWeight={500}>
                            {(name ?? '').length > 14 ? (name ?? '').slice(0, 13) + '…' : name}
                          </text>
                        )}
                      </g>
                    )
                  }}
                  onClick={(data) => {
                    const found = rows.find((r) => r.name === (data as { name?: string }).name)
                    if (found) setDrillCat(found)
                  }}
                >
                  <Tooltip formatter={(v) => fmt(Number(v ?? 0), currency, locale)} />
                </Treemap>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top 10 table */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b">
              <h3 className="text-sm font-semibold">
                {drillCat ? `Detalle: ${drillCat.name}` : 'Top categorías'}
              </h3>
            </div>
            <table className="w-full text-xs">
              <thead className="border-b text-muted-foreground">
                <tr>
                  <th className="px-5 py-2 text-left font-medium">Categoría</th>
                  <th className="px-5 py-2 text-right font-medium">Total</th>
                  <th className="px-5 py-2 text-right font-medium">Cant.</th>
                  <th className="px-5 py-2 text-right font-medium">Promedio</th>
                  <th className="px-5 py-2 text-right font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer" onClick={() => setDrillCat(drillCat?.id === r.id ? null : r)}>
                    <td className="px-5 py-2 flex items-center gap-2">
                      <span className="size-2.5 rounded-full shrink-0" style={{ background: r.color }} />
                      {r.name}
                    </td>
                    <td className="px-5 py-2 text-right tabular-nums font-medium">{fmt(r.total, currency, locale)}</td>
                    <td className="px-5 py-2 text-right tabular-nums text-muted-foreground">{r.count}</td>
                    <td className="px-5 py-2 text-right tabular-nums text-muted-foreground">{fmt(r.count > 0 ? r.total / r.count : 0, currency, locale)}</td>
                    <td className="px-5 py-2 text-right tabular-nums text-muted-foreground">{total > 0 ? ((r.total / total) * 100).toFixed(1) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
