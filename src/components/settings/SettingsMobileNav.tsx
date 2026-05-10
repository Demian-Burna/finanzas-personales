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
 * Native <select> for settings tab navigation on mobile.
 * Hidden on desktop (lg:hidden) — the sidebar handles desktop.
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
        className="w-full rounded-xl border bg-muted/40 px-3 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
      >
        {TABS.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
    </div>
  )
}
