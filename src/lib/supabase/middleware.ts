import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Guard: if env vars are missing/empty, pass through without auth check
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[middleware] Missing Supabase env vars')
    return supabaseResponse
  }

  let user = null

  try {
    const supabase = createServerClient<Database>(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch (err) {
    // Log the real error so it appears in Vercel runtime logs
    console.error('[middleware] Supabase error:', err)
    return supabaseResponse
  }

  const url = request.nextUrl.clone()
  const isAuthRoute = url.pathname.startsWith('/login')
  const isDashboardRoute =
    url.pathname === '/' ||
    url.pathname.startsWith('/transactions') ||
    url.pathname.startsWith('/budgets') ||
    url.pathname.startsWith('/goals') ||
    url.pathname.startsWith('/reports') ||
    url.pathname.startsWith('/settings') ||
    url.pathname.startsWith('/onboarding')

  if (!user && isDashboardRoute) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
