'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

function getOrigin(headersList: Awaited<ReturnType<typeof headers>>) {
  const host = headersList.get('x-forwarded-host') ?? headersList.get('host') ?? ''
  const proto = headersList.get('x-forwarded-proto') ?? 'https'
  return host
    ? `${proto}://${host}`
    : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/^﻿/, '').trim()
}

export async function signInWithGoogle() {
  const supabase = await createClient()

  const headersList = await headers()
  const origin = getOrigin(headersList)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    redirect('/login?error=oauth_error')
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function signInWithMagicLink(formData: FormData) {
  const raw = (formData.get('email') as string | null)?.trim()
  if (!raw) {
    redirect('/login?error=invalid_email')
  }
  const email = raw as string

  const supabase = await createClient()
  const headersList = await headers()
  const origin = getOrigin(headersList)

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  })

  if (error) {
    redirect('/login?error=magic_link_error')
  }

  redirect(`/login?magic_sent=1&email=${encodeURIComponent(email)}`)
}
