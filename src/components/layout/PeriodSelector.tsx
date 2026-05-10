'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFinanceStore } from '@/stores/finance.store'

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export function PeriodSelector() {
  const { selectedPeriod, setSelectedPeriod } = useFinanceStore()

  const month = selectedPeriod.from.getMonth()
  const year = selectedPeriod.from.getFullYear()

  function navigate(delta: -1 | 1) {
    const d = new Date(year, month + delta, 1)
    const from = new Date(d.getFullYear(), d.getMonth(), 1)
    const to = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    to.setHours(23, 59, 59, 999)
    setSelectedPeriod({ from, to })
  }

  const label = `${MONTHS_ES[month] ?? ''} ${year}`

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => navigate(-1)}
        aria-label="Mes anterior"
      >
        <ChevronLeft className="size-4" />
      </Button>

      <span className="min-w-[9rem] text-center text-sm font-medium tabular-nums">
        {label}
      </span>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => navigate(1)}
        aria-label="Mes siguiente"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}
