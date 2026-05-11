'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function MagicLinkListener() {
  const router = useRouter()

  useEffect(() => {
    let channel: BroadcastChannel | null = null
    try {
      channel = new BroadcastChannel('supabase_auth')
      channel.onmessage = (e: MessageEvent) => {
        if (e.data?.type === 'SIGNED_IN') {
          router.replace('/')
        }
      }
    } catch {
      // BroadcastChannel not supported
    }
    return () => channel?.close()
  }, [router])

  return null
}
