import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/env'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', origin))
  }

  // Build the redirect response first so we can attach cookies to it.
  // Supabase SSR writes the session tokens via setAll() — they must land
  // on the outgoing response or the browser won't have a session after redirect.
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
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[callback] exchangeCodeForSession:', error.message)
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

    // Overwrite the location header with the real destination
    redirectResponse.headers.set('location', new URL(destination, origin).toString())
    return redirectResponse
  } catch (err) {
    console.error('[callback] unexpected error:', err)
    return NextResponse.redirect(new URL('/login?error=auth_error', origin))
  }
}
