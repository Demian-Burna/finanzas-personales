'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function parseMonth(param: string | null): { year: number; month: number } {
  if (param && /^\d{4}-\d{2}$/.test(param)) {
    const [y, m] = param.split('-').map(Number)
    if (y && m && m >= 1 && m <= 12) return { year: y, month: m - 1 }
  }
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() }
}

export function PeriodSelector() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const { year, month } = parseMonth(params.get('month'))

  function navigate(delta: -1 | 1) {
    const d = new Date(year, month + delta, 1)
    const nextMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const next = new URLSearchParams(params.toString())
    next.set('month', nextMonth)
    router.push(`${pathname}?${next.toString()}`)
  }

  const label = `${MONTHS_ES[month] ?? ''} ${year}`

  const now = new Date()
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  function goToToday() {
    const next = new URLSearchParams(params.toString())
    next.delete('month')
    router.push(`${pathname}?${next.toString()}`)
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)} aria-label="Mes anterior">
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-[9rem] text-center text-sm font-medium tabular-nums">
        {label}
      </span>
      <Button variant="ghost" size="icon-sm" onClick={() => navigate(1)} aria-label="Mes siguiente">
        <ChevronRight className="size-4" />
      </Button>
      {!isCurrentMonth && (
        <Button
          variant="outline"
          size="sm"
          onClick={goToToday}
          className="ml-1 h-7 px-2 text-xs"
          aria-label="Volver al mes actual"
        >
          Hoy
        </Button>
      )}
    </div>
  )
}
