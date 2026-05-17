'use client'

import { useState } from 'react'
import { X, AlertTriangle, RefreshCcw, Target, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui.store'

type NotifType = 'budget_alert' | 'recurring_due' | 'goal_milestone' | 'weekly_summary'

interface Notif {
  id: string
  type: NotifType
  title: string
  body: string
  time: string
  read: boolean
  action?: { label: string; href: string }
}

const ICON_MAP: Record<NotifType, React.ElementType> = {
  budget_alert:    AlertTriangle,
  recurring_due:   RefreshCcw,
  goal_milestone:  Target,
  weekly_summary:  BarChart3,
}

const COLOR_MAP: Record<NotifType, string> = {
  budget_alert:   'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400',
  recurring_due:  'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  goal_milestone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
  weekly_summary: 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
}

const MOCK: Notif[] = [
  { id: '1', type: 'budget_alert',   read: false, time: '9:32',  title: 'Supermercado excedió el presupuesto', body: 'Llegaste al 109% del límite mensual ($320.000). Te quedan 23 días del período.', action: { label: 'Ver presupuesto', href: '/budgets' } },
  { id: '2', type: 'recurring_due',  read: false, time: '8:00',  title: 'Netflix Premium vence hoy', body: '$8.990 se cargará a Visa Galicia. Podés cancelar el aviso desde Recurrentes.', action: { label: 'Registrar ahora', href: '/recurring' } },
  { id: '3', type: 'goal_milestone', read: false, time: 'Ayer',  title: '¡Llegaste al 75% de tu meta!', body: 'Fondo de emergencia: $870.000 de $1.160.000. Faltan ~3 meses al ritmo actual.', action: { label: 'Ver meta', href: '/goals' } },
  { id: '4', type: 'recurring_due',  read: true,  time: 'Mar',   title: 'Spotify Familiar vence en 4 días', body: '$3.290 se cargará el 12 May.' },
  { id: '5', type: 'weekly_summary', read: true,  time: 'Lun',   title: 'Resumen semanal', body: 'Gastaste 18% menos que la semana pasada. Tu día más caro: lunes.', action: { label: 'Ver detalle', href: '/reports' } },
]

const TABS: { key: NotifType | 'all'; label: string }[] = [
  { key: 'all',          label: 'Todas' },
  { key: 'budget_alert', label: 'Alertas' },
  { key: 'recurring_due', label: 'Recurrentes' },
  { key: 'goal_milestone', label: 'Metas' },
]

export function NotificationsDrawer() {
  const { notificationsOpen, setNotificationsOpen } = useUIStore()
  const [notifs, setNotifs] = useState<Notif[]>(MOCK)
  const [tab, setTab] = useState<NotifType | 'all'>('all')

  const filtered = tab === 'all' ? notifs : notifs.filter((n) => n.type === tab)
  const unreadCount = notifs.filter((n) => !n.read).length

  function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  function markRead(id: string) {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  }

  const today = filtered.filter((_, i) => i < 3)
  const week  = filtered.filter((_, i) => i >= 3 && i < 5)
  const older = filtered.filter((_, i) => i >= 5)

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300',
          notificationsOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setNotificationsOpen(false)}
        aria-hidden
      />

      {/* Drawer — slides from top */}
      <div
        className={cn(
          'fixed top-0 inset-x-0 z-50 bg-background rounded-b-2xl shadow-2xl',
          'max-h-[85dvh] flex flex-col transition-transform duration-300 ease-out',
          notificationsOpen ? 'translate-y-0' : '-translate-y-full',
        )}
        role="dialog"
        aria-modal
        aria-label="Notificaciones"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-12 pb-3 border-b">
          <div>
            <p className="text-base font-semibold">Notificaciones</p>
            {unreadCount > 0 && (
              <p className="text-xs-plus text-muted-foreground">{unreadCount} nueva{unreadCount !== 1 ? 's' : ''}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Marcar todas como leídas
              </button>
            )}
            <button
              type="button"
              onClick={() => setNotificationsOpen(false)}
              className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 px-4 py-3 border-b overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {TABS.map(({ key, label }) => {
            const count = key === 'all' ? unreadCount : notifs.filter((n) => n.type === key && !n.read).length
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  'flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  tab === key
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:bg-muted',
                )}
              >
                {label}
                {count > 0 && (
                  <span className={cn('flex size-4 items-center justify-center rounded-full text-[9px] font-bold', tab === key ? 'bg-white/20' : 'bg-muted-foreground/20')}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="text-4xl">🔔</span>
              <p className="text-sm text-muted-foreground">Sin notificaciones</p>
            </div>
          ) : (
            <>
              {[
                { label: 'Hoy', items: today },
                { label: 'Esta semana', items: week },
                { label: 'Anteriores', items: older },
              ].filter(({ items }) => items.length > 0).map(({ label, items }) => (
                <div key={label}>
                  <p className="px-5 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground bg-muted/30">
                    {label}
                  </p>
                  <div className="divide-y divide-border">
                    {items.map((n) => {
                      const Icon = ICON_MAP[n.type]
                      return (
                        <div
                          key={n.id}
                          className={cn(
                            'px-5 py-4 transition-colors',
                            !n.read && 'bg-blue-50/50 dark:bg-blue-950/10',
                          )}
                        >
                          <div className="flex items-start gap-3">
                            {/* Unread dot */}
                            <div className="mt-1 shrink-0 w-2 flex justify-center">
                              {!n.read && <span className="size-2 rounded-full bg-blue-500 block" />}
                            </div>

                            <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full text-sm', COLOR_MAP[n.type])}>
                              <Icon className="size-4" strokeWidth={1.75} />
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline justify-between gap-2">
                                <p className={cn('text-xs font-semibold truncate', !n.read && 'text-foreground')}>{n.title}</p>
                                <span className="text-[10px] text-muted-foreground shrink-0">{n.time}</span>
                              </div>
                              <p className="mt-0.5 text-xs-plus text-muted-foreground leading-relaxed line-clamp-2">{n.body}</p>
                              {n.action && (
                                <button
                                  type="button"
                                  onClick={() => { markRead(n.id); setNotificationsOpen(false) }}
                                  className="mt-2 inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium hover:bg-muted transition-colors"
                                >
                                  {n.action.label}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  )
}
