'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthCompletePage() {
  const router = useRouter()
  const [seconds, setSeconds] = useState(5)
  const [closing, setClosing] = useState(true)

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get('next') ?? '/'

    try {
      const channel = new BroadcastChannel('supabase_auth')
      channel.postMessage({ type: 'SIGNED_IN', next })
      channel.close()
    } catch {
      router.replace(next)
      return
    }

    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval)
          const closed = (() => { try { window.close(); return true } catch { return false } })()
          if (!closed) setClosing(false)
          return 0
        }
        return s - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <img src="/logo-icono.svg" alt="Finanzas Personales" width={56} height={56} />
      <div className="space-y-1">
        <p className="text-lg font-semibold">Inicio de sesión exitoso</p>
        <p className="text-sm text-muted-foreground">Volvé a la pestaña anterior para continuar.</p>
      </div>
      <p className="text-xs text-muted-foreground">
        {closing && seconds > 0
          ? `Esta pestaña se cerrará en ${seconds} segundo${seconds !== 1 ? 's' : ''}...`
          : 'Podés cerrar esta pestaña manualmente.'}
      </p>
    </div>
  )
}
