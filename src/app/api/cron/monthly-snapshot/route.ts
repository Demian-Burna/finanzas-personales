import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAccounts } from '@/lib/supabase/queries/accounts'

// Called on the 1st of each month at 02:00 UTC by Vercel Cron
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expected = `Bearer ${process.env['CRON_SECRET'] ?? ''}`

  if (process.env['CRON_SECRET'] && authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Get all users with profiles
  const { data: profilesRaw } = await supabase
    .from('profiles')
    .select('id')

  const profiles = (profilesRaw as Array<{ id: string }> | null) ?? []

  if (!profiles.length) {
    return NextResponse.json({ processed: 0 })
  }

  // Previous month
  const now = new Date()
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const snapshotDate = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}-01`

  let processed = 0

  for (const profile of profiles) {
    // Check if snapshot exists
    const { data: existing } = await supabase
      .from('monthly_snapshots')
      .select('id')
      .eq('user_id', profile.id)
      .eq('snapshot_date', snapshotDate)
      .maybeSingle()

    if (existing) continue

    const { data: accounts } = await getAccounts(supabase)
    const userAccounts = accounts.filter((a) => a.user_id === profile.id)

    const totalAssets = userAccounts
      .filter((a) => a.account_type?.nature !== 'liability')
      .reduce((s, a) => s + a.current_balance, 0)

    const totalLiabilities = userAccounts
      .filter((a) => a.account_type?.nature === 'liability')
      .reduce((s, a) => s + a.current_balance, 0)

    await supabase.from('monthly_snapshots').upsert({
      user_id: profile.id,
      snapshot_date: snapshotDate,
      net_worth: totalAssets - totalLiabilities,
      total_assets: totalAssets,
      total_liabilities: totalLiabilities,
    } as never)

    processed++
  }

  return NextResponse.json({ processed })
}
