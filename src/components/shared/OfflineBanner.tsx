'use client'

import { useEffect, useState, useCallback } from 'react'
import { WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export function OfflineBanner() {
  const [offline, setOffline] = useState(false)
  const [sinceLabel, setSinceLabel] = useState<string | null>(null)
  const [offlineSince, setOfflineSince] = useState<Date | null>(null)

  const updateLabel = useCallback((since: Date) => {
    const mins = Math.round((Date.now() - since.getTime()) / 60_000)
    setSinceLabel(mins <= 1 ? 'justo ahora' : `hace ${mins} min`)
  }, [])

  useEffect(() => {
    const goOffline = () => {
      const now = new Date()
      setOffline(true)
      setOfflineSince(now)
      setSinceLabel('justo ahora')
    }
    const goOnline = () => {
      setOffline(false)
      setOfflineSince(null)
      setSinceLabel(null)
    }

    // Check immediately
    if (!navigator.onLine) goOffline()

    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  // Update "hace N min" every minute
  useEffect(() => {
    if (!offline || !offlineSince) return
    const id = setInterval(() => updateLabel(offlineSince), 60_000)
    return () => clearInterval(id)
  }, [offline, offlineSince, updateLabel])

  if (!offline) return null

  return (
    <div
      className={cn(
        'fixed top-0 inset-x-0 z-[60] flex items-center justify-between gap-3',
        'bg-amber-500 px-4 py-2 text-white text-xs font-medium',
      )}
      role="alert"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="size-3.5 shrink-0" strokeWidth={2} />
        <span>
          Sin conexión{sinceLabel ? ` · mostrando datos de ${sinceLabel}` : ''}
        </span>
      </div>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="shrink-0 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold hover:bg-white/30 transition-colors"
      >
        Reintentar
      </button>
    </div>
  )
}
