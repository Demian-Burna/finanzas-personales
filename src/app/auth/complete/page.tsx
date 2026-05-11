'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthCompletePage() {
  const router = useRouter()
  const [canClose, setCanClose] = useState(true)

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get('next') ?? '/'

    try {
      const channel = new BroadcastChannel('supabase_auth')
      channel.postMessage({ type: 'SIGNED_IN', next })
      channel.close()
    } catch {
      // BroadcastChannel not supported — navigate this tab instead
      router.replace(next)
      return
    }

    // Give the browser a moment to close; if still open, show the fallback message
    window.close()
    setTimeout(() => setCanClose(false), 500)
  }, [router])

  if (canClose) return null

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-2xl text-primary-foreground shadow-sm">
        💰
      </div>
      <p className="text-base font-medium">¡Sesión iniciada!</p>
      <p className="text-sm text-muted-foreground">
        Podés cerrar esta pestaña y volver a la anterior.
      </p>
    </div>
  )
}
