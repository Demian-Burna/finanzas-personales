'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthCompletePage() {
  const router = useRouter()

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get('next') ?? '/'
    try {
      const channel = new BroadcastChannel('supabase_auth')
      channel.postMessage({ type: 'SIGNED_IN' })
      channel.close()
    } catch {
      // BroadcastChannel not supported (Safari older versions)
    }
    router.replace(next)
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Iniciando sesión...</p>
    </div>
  )
}
