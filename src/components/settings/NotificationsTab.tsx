'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface NotifPref { key: string; label: string; description: string; inApp: boolean; email: boolean }

const DEFAULT_PREFS: NotifPref[] = [
  { key: 'budget_alert',      label: 'Alertas de presupuesto',   description: 'Cuando un presupuesto supera el umbral configurado', inApp: true,  email: false },
  { key: 'recurring_reminder', label: 'Recordatorio recurrentes', description: 'Días antes del vencimiento',                         inApp: true,  email: true },
  { key: 'goal_milestone',    label: 'Hitos de metas',            description: 'Al alcanzar 50, 75 o 100%',                          inApp: true,  email: false },
  { key: 'weekly_summary',    label: 'Resumen semanal',           description: 'Cada lunes a la mañana',                             inApp: false, email: false },
]

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onToggle}
      className="relative inline-flex shrink-0 items-center rounded-full transition-colors focus:outline-none"
      style={{ width: 38, height: 22, background: on ? 'var(--success)' : 'var(--muted)', padding: 2 }}
    >
      <span className="inline-block rounded-full bg-white shadow transition-transform"
        style={{ width: 18, height: 18, transform: on ? 'translateX(16px)' : 'translateX(0)', boxShadow: '0 1px 3px oklch(0 0 0 / 0.2)' }} />
    </button>
  )
}

function Group({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      {title && <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>}
      <div className="overflow-hidden rounded-xl border bg-card divide-y divide-border">{children}</div>
    </section>
  )
}

export function NotificationsTab() {
  const [prefs, setPrefs] = useState<NotifPref[]>(DEFAULT_PREFS)
  const [inAppMaster, setInAppMaster] = useState(true)
  const [emailMaster, setEmailMaster] = useState(false)
  const [advanceDays, setAdvanceDays] = useState(3)
  const [isPending, startTransition] = useTransition()

  function toggle(key: string, channel: 'inApp' | 'email') {
    setPrefs((prev) => prev.map((p) => p.key === key ? { ...p, [channel]: !p[channel] } : p))
  }

  function handleSave() {
    startTransition(async () => {
      const supabase = createClient()
      const payload = {
        prefs: prefs.reduce((acc, p) => ({ ...acc, [p.key]: { inApp: p.inApp, email: p.email } }), {}),
        advance_days: advanceDays,
      }
      const { error } = await supabase.from('profiles').update({ notification_prefs: payload } as never)
        .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
      if (error) toast.error(error.message)
      else toast.success('Preferencias guardadas')
    })
  }

  return (
    <div className="max-w-2xl px-4 lg:px-0 pt-2 pb-6 lg:py-0">
      {/* Canales */}
      <Group title="Canales">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <Bell className="size-4 text-muted-foreground shrink-0" strokeWidth={1.75} />
          <div className="flex-1">
            <p className="text-sm font-medium">Avisos in-app</p>
            <p className="text-xs-plus text-muted-foreground">Banner en el dashboard y campana</p>
          </div>
          <Toggle on={inAppMaster} onToggle={() => setInAppMaster(v => !v)} />
        </div>
        <div className="flex items-center gap-3 px-4 py-3.5">
          <svg className="size-4 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium">Email</p>
            <p className="text-xs-plus text-muted-foreground">{typeof window !== 'undefined' ? '' : ''}</p>
          </div>
          <Toggle on={emailMaster} onToggle={() => setEmailMaster(v => !v)} />
        </div>
      </Group>

      {/* Qué quiero recibir */}
      <Group title="Qué quiero recibir">
        {prefs.map((pref, i) => (
          <div key={pref.key} className={`px-4 py-3.5 ${i < prefs.length - 1 ? 'border-b border-border' : ''}`}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-medium">{pref.label}</p>
                <p className="text-xs-plus text-muted-foreground mt-0.5">{pref.description}</p>
              </div>
            </div>
            <div className="flex gap-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <Toggle on={pref.inApp} onToggle={() => toggle(pref.key, 'inApp')} />
                <span className="text-xs-plus text-muted-foreground">In-app</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Toggle on={pref.email} onToggle={() => toggle(pref.key, 'email')} />
                <span className="text-xs-plus text-muted-foreground">Email</span>
              </label>
            </div>
          </div>
        ))}
      </Group>

      {/* Aviso anticipado */}
      <Group title="Aviso anticipado">
        <div className="px-4 py-3.5">
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-[13.5px] font-medium">Recurrentes</p>
            <span className="text-sm font-bold tabular-nums">{advanceDays} días</span>
          </div>
          <div className="relative h-1.5 rounded-full bg-muted">
            <div className="absolute left-0 top-0 bottom-0 rounded-full" style={{ width: `${(advanceDays / 30) * 100}%`, background: 'var(--accent)' }} />
          </div>
          <input type="range" min={1} max={30} value={advanceDays} onChange={e => setAdvanceDays(Number(e.target.value))}
            className="w-full mt-2 accent-current" style={{ accentColor: 'var(--accent)' }} />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">1 día</span>
            <span className="text-[10px] text-muted-foreground">30 días</span>
          </div>
        </div>
      </Group>

      <Button onClick={handleSave} disabled={isPending} className="w-full lg:w-auto">
        {isPending ? 'Guardando...' : 'Guardar preferencias'}
      </Button>
    </div>
  )
}
