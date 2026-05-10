import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', origin))
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[callback] exchangeCodeForSession error:', error)
      return NextResponse.redirect(new URL('/login?error=auth_error', origin))
    }

    const { data } = await supabase.auth.getUser()
    const user = data?.user ?? null

    if (!user) {
      return NextResponse.redirect(new URL('/login?error=no_user', origin))
    }

    const { data: profileRaw } = await supabase
      .from('profiles')
      .select('onboarding_completed_at')
      .eq('id', user.id)
      .single()

    const profile = profileRaw as { onboarding_completed_at: string | null } | null

    if (!profile?.onboarding_completed_at) {
      return NextResponse.redirect(new URL('/onboarding', origin))
    }

    return NextResponse.redirect(new URL(next, origin))
  } catch (err) {
    console.error('[callback] unexpected error:', err)
    return NextResponse.redirect(new URL('/login?error=auth_error', origin))
  }
}
