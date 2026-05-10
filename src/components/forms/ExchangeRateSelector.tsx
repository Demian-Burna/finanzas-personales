'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, TrendingUp } from 'lucide-react'
import type { ExchangeRateData, RateOption } from '@/lib/exchange-rates'
import { cn } from '@/lib/utils'

interface Props {
  fromCurrency: string
  toCurrency: string
  amount: number
  selectedType: string
  onSelect: (rate: RateOption) => void
}

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

export function ExchangeRateSelector({
  fromCurrency,
  toCurrency,
  amount,
  selectedType,
  onSelect,
}: Props) {
  const [data, setData] = useState<ExchangeRateData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (fromCurrency === toCurrency) { setData(null); return }
    setLoading(true)
    setError(false)
    fetch(`/api/exchange-rates?from=${fromCurrency}&to=${toCurrency}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ExchangeRateData | null) => {
        setData(d)
        if (d?.options[0]) onSelect(d.options[0])
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromCurrency, toCurrency])

  if (fromCurrency === toCurrency) return null

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <TrendingUp className="size-3" />
        <span>Tipo de cambio ({fromCurrency} → {toCurrency})</span>
        {loading && <RefreshCw className="size-3 animate-spin ml-auto" />}
      </div>

      {error && (
        <p className="text-xs text-destructive">No se pudieron obtener los tipos de cambio</p>
      )}

      {data && (
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {data.options.map((opt) => {
            const converted = amount * opt.rate
            const isSelected = opt.type === selectedType
            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => onSelect(opt)}
                className={cn(
                  'rounded-md border p-2 text-left text-xs transition-all',
                  isSelected
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground',
                )}
              >
                <p className="font-semibold">{opt.label}</p>
                <p className="tabular-nums text-[10px] mt-0.5">
                  {fmt(opt.rate, toCurrency)}<span className="text-muted-foreground">/{fromCurrency}</span>
                </p>
                {amount > 0 && (
                  <p className={cn('tabular-nums font-medium mt-1', isSelected ? 'text-primary' : '')}>
                    ≈ {fmt(converted, toCurrency)}
                  </p>
                )}
              </button>
            )
          })}
        </div>
      )}

      {data && (
        <p className="text-[10px] text-muted-foreground">
          Fuente: {data.fromCurrency === 'USD' || data.fromCurrency === 'EUR' ? 'Bluelytics.com.ar' : 'Open Exchange Rates'} ·
          Actualizado: {new Date(data.lastUpdate).toLocaleString('es-AR', { timeStyle: 'short', dateStyle: 'short' })}
        </p>
      )}
    </div>
  )
}
