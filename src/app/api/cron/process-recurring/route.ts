import { NextResponse } from 'next/server'
import { processRecurringItemsAction } from '@/app/(dashboard)/recurring/actions'

// Called daily by Vercel Cron at 06:00 UTC
// Vercel sends the CRON_SECRET as Authorization header for security
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expected = `Bearer ${process.env['CRON_SECRET'] ?? ''}`

  if (process.env['CRON_SECRET'] && authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await processRecurringItemsAction()

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json(result.data)
}
