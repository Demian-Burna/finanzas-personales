import { NextResponse } from 'next/server'
import { getExchangeRates } from '@/lib/exchange-rates'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')?.toUpperCase()
  const to = searchParams.get('to')?.toUpperCase()

  if (!from || !to) {
    return NextResponse.json({ error: 'Missing from/to parameters' }, { status: 400 })
  }

  const data = await getExchangeRates(from, to)
  if (!data) {
    return NextResponse.json({ error: 'Rates unavailable' }, { status: 404 })
  }

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600' },
  })
}
