'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Tabs } from '@/components/ui/tabs'

/**
 * Client wrapper that keeps the active settings tab in sync with the URL
 * (?tab=accounts, ?tab=categories, etc.) so each panel has its own shareable
 * URL and refreshing lands on the correct tab.
 */
export function SettingsTabs({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const tab = params.get('tab') ?? 'profile'

  function handleTabChange(value: string) {
    const next = new URLSearchParams(params.toString())
    next.set('tab', value)
    router.replace(`${pathname}?${next.toString()}`)
  }

  return (
    <Tabs value={tab} onValueChange={handleTabChange}>
      {children}
    </Tabs>
  )
}
