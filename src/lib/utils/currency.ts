import { CURRENCY } from '@/lib/constants'

export function formatCurrency(amount: number, currency = CURRENCY.DEFAULT): string {
  return new Intl.NumberFormat(CURRENCY.LOCALE, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatCompactCurrency(amount: number, currency = CURRENCY.DEFAULT): string {
  return new Intl.NumberFormat(CURRENCY.LOCALE, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount)
}
