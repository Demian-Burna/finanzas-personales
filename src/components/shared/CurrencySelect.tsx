'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const CURRENCIES = [
  { code: 'ARS', label: 'ARS — Peso argentino' },
  { code: 'USD', label: 'USD — Dólar estadounidense' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'BRL', label: 'BRL — Real brasileño' },
  { code: 'CLP', label: 'CLP — Peso chileno' },
  { code: 'UYU', label: 'UYU — Peso uruguayo' },
  { code: 'PYG', label: 'PYG — Guaraní paraguayo' },
  { code: 'BOB', label: 'BOB — Boliviano' },
  { code: 'PEN', label: 'PEN — Sol peruano' },
  { code: 'COP', label: 'COP — Peso colombiano' },
  { code: 'MXN', label: 'MXN — Peso mexicano' },
  { code: 'GBP', label: 'GBP — Libra esterlina' },
  { code: 'JPY', label: 'JPY — Yen japonés' },
  { code: 'CHF', label: 'CHF — Franco suizo' },
  { code: 'CAD', label: 'CAD — Dólar canadiense' },
  { code: 'USDT', label: 'USDT — Tether' },
] as const

export type CurrencyCode = (typeof CURRENCIES)[number]['code']

interface Props {
  value: string
  onValueChange: (value: string) => void
  className?: string
}

export function CurrencySelect({ value, onValueChange, className }: Props) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v ?? value)}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Moneda" />
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            {c.code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
