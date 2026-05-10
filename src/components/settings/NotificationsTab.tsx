'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Bell, Mail } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface NotificationPref {
  key: string
  label: string
  description: string
  inApp: boolean
  email: boolean
}

const DEFAULT_PREFS: NotificationPref[] = [
  { key: 'budget_alert', label: 'Alertas de presupuesto', description: 'Cuando un presupuesto supera el umbral configurado', inApp: true, email: false },
  { key: 'recurring_reminder', label: 'Recordatorio de recurrentes', description: 'Días antes de que venza un gasto recurrente', inApp: true, email: false },
  { key: 'goal_milestone', label: 'Hitos de metas', description: 'Cuando alcanzás el 50%, 75% o 100% de una meta', inApp: true, email: false },
  { key: 'weekly_summary', label: 'Resumen semanal', description: 'Un resumen de tus finanzas cada lunes', inApp: false, email: false },
]

export function NotificationsTab() {
  const [prefs, setPrefs] = useState<NotificationPref[]>(DEFAULT_PREFS)
  const [advanceDays, setAdvanceDays] = useState(3)
  const [isPending, startTransition] = useTransition()

  function toggle(key: string, channel: 'inApp' | 'email') {
    setPrefs((prev) => prev.map((p) => p.key === key ? { ...p, [channel]: !p[channel] } : p))
  }

  function handleSave() {
    startTransition(async () => {
      // Persist to profiles.notification_prefs (jsonb column)
      const supabase = createClient()
      const payload = { prefs: prefs.reduce((acc, p) => ({ ...acc, [p.key]: { inApp: p.inApp, email: p.email } }), {}), advance_days: advanceDays }
      const { error } = await supabase.from('profiles').update({ notification_prefs: payload } as never).eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
      if (error) toast.error(error.message)
      else toast.success('Preferencias guardadas')
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-3">
        {prefs.map((pref) => (
          <div key={pref.key} className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
            <div>
              <p className="text-sm font-medium">{pref.label}</p>
              <p className="text-xs text-muted-foreground">{pref.description}</p>
            </div>
            <div className="flex gap-6">
              {/* In-app toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <Bell className="size-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">In-app</span>
                <button type="button" role="switch" aria-checked={pref.inApp}
                  onClick={() => toggle(pref.key, 'inApp')}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${pref.inApp ? 'bg-primary' : 'bg-muted'}`}>
                  <span className={`inline-block size-3.5 rounded-full bg-white shadow transition-transform ${pref.inApp ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </label>
              {/* Email toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <Mail className="size-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Email</span>
                <button type="button" role="switch" aria-checked={pref.email}
                  onClick={() => toggle(pref.key, 'email')}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${pref.email ? 'bg-primary' : 'bg-muted'}`}>
                  <span className={`inline-block size-3.5 rounded-full bg-white shadow transition-transform ${pref.email ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Advance notice days */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <Label>Aviso anticipado de recurrentes</Label>
            <p className="text-xs text-muted-foreground">Días antes de que venza un gasto recurrente</p>
          </div>
          <span className="text-sm font-bold">{advanceDays}d</span>
        </div>
        <input type="range" min={1} max={30} value={advanceDays} onChange={(e) => setAdvanceDays(Number(e.target.value))} className="w-full accent-primary" />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
          <span>1 día</span><span>30 días</span>
        </div>
      </div>

      <Button onClick={handleSave} disabled={isPending}>
        {isPending ? 'Guardando...' : 'Guardar preferencias'}
      </Button>
    </div>
  )
}
