import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/env'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'

  if (!code && (!tokenHash || !type)) {
    return NextResponse.redirect(new URL('/login?error=invalid_link', origin))
  }

  const redirectResponse = NextResponse.redirect(new URL('/', origin))

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          redirectResponse.cookies.set(name, value, options)
        })
      },
    },
  })

  try {
    let authError: { message: string } | null = null

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      authError = error
    } else {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: type! })
      authError = error
    }

    if (authError) {
      console.error('[confirm] auth error:', authError.message)
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
    const destination = profile?.onboarding_completed_at ? next : '/onboarding'

    const completeUrl = new URL('/auth/complete', origin)
    completeUrl.searchParams.set('next', destination)
    redirectResponse.headers.set('location', completeUrl.toString())
    return redirectResponse
  } catch (err) {
    console.error('[confirm] unexpected error:', err)
    return NextResponse.redirect(new URL('/login?error=auth_error', origin))
  }
}
