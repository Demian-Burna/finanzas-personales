'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

const TABS = [
  { value: 'profile',       label: 'Perfil' },
  { value: 'accounts',      label: 'Cuentas' },
  { value: 'categories',    label: 'Categorías' },
  { value: 'notifications', label: 'Notificaciones' },
  { value: 'data',          label: 'Datos' },
]

/**
 * Full-width native <select> for settings tab navigation.
 * Rendered outside <SettingsTabs> so it sits between the page title
 * and the tab content — never inside the Tabs flex tree.
 * Hidden on desktop (lg:hidden) where the sidebar handles navigation.
 */
export function SettingsMobileNav() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const tab = params.get('tab') ?? 'profile'

  function handleChange(value: string) {
    const next = new URLSearchParams(params.toString())
    next.set('tab', value)
    router.replace(`${pathname}?${next.toString()}`)
  }

  return (
    <div className="lg:hidden">
      <select
        value={tab}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full rounded-xl border bg-muted/40 px-3 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {TABS.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
    </div>
  )
}
