'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  ChevronRight, Wallet, Tag, Globe, Bell, Database,
  HelpCircle, FileText, LogOut, Sun, Moon, Monitor,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'
import { signOut } from '@/app/(dashboard)/actions'

interface Props {
  user: User | null
  profile: {
    display_name: string | null
    avatar_url: string | null
  } | null
}

interface RowProps {
  icon: React.ElementType
  iconBg: string
  label: string
  subtitle?: string
  href?: string
  onClick?: () => void
  right?: React.ReactNode
}

function SettingsRow({ icon: Icon, iconBg, label, subtitle, href, onClick, right }: RowProps) {
  const content = (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: iconBg }}
      >
        <Icon className="size-4 text-white" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight">{label}</p>
        {subtitle && <p className="text-xs-plus text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {right ?? <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />}
    </div>
  )

  if (href) {
    return <Link href={href} className="block hover:bg-muted/50 transition-colors active:bg-muted">{content}</Link>
  }
  return <button type="button" onClick={onClick} className="w-full text-left hover:bg-muted/50 transition-colors active:bg-muted">{content}</button>
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <div className="overflow-hidden rounded-xl border bg-card divide-y divide-border">
        {children}
      </div>
    </div>
  )
}

export function SettingsMobileIndex({ user, profile }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const { resolvedTheme, setTheme } = useTheme()
  const [isSigningOut, startSignOut] = useTransition()

  const displayName = profile?.display_name ?? user?.email ?? ''
  const avatarUrl = profile?.avatar_url ?? (user?.user_metadata?.['avatar_url'] as string | undefined)
  const initials = displayName[0]?.toUpperCase() ?? '?'

  function goTo(tab: string) {
    const next = new URLSearchParams(params.toString())
    next.set('tab', tab)
    router.push(`${pathname}?${next.toString()}`)
  }

  function cycleTheme() {
    if (resolvedTheme === 'dark') setTheme('light')
    else if (resolvedTheme === 'light') setTheme('system')
    else setTheme('dark')
  }

  const themeLabel = resolvedTheme === 'dark' ? 'Oscuro' : resolvedTheme === 'light' ? 'Claro' : 'Sistema'
  const ThemeIcon = resolvedTheme === 'dark' ? Moon : resolvedTheme === 'light' ? Sun : Monitor

  return (
    <div className="space-y-5 px-4 pt-4 pb-8">
      {/* User card */}
      <button
        type="button"
        onClick={() => goTo('profile')}
        className="flex w-full items-center gap-4 rounded-xl border bg-card px-4 py-4 hover:bg-muted/50 transition-colors active:bg-muted"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={displayName} className="size-14 shrink-0 rounded-full object-cover ring-2 ring-border" referrerPolicy="no-referrer" />
        ) : (
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
            {initials}
          </span>
        )}
        <div className="min-w-0 flex-1 text-left">
          <p className="font-semibold truncate">{displayName}</p>
          {user?.email && <p className="text-xs-plus text-muted-foreground truncate mt-0.5">{user.email}</p>}
        </div>
        <span className="text-xs text-muted-foreground shrink-0">Editar</span>
        <ChevronRight className="size-4 text-muted-foreground/50 shrink-0" />
      </button>

      {/* CUENTA */}
      <SectionCard title="Cuenta">
        <SettingsRow icon={Wallet} iconBg="oklch(0.52 0.17 255)" label="Cuentas y saldos" onClick={() => goTo('accounts')} />
        <SettingsRow icon={Tag} iconBg="oklch(0.55 0.16 155)" label="Categorías" onClick={() => goTo('categories')} />
        <SettingsRow icon={Globe} iconBg="oklch(0.55 0.12 200)" label="Moneda y región" subtitle="Preferencias de formato" onClick={() => goTo('profile')} />
      </SectionCard>

      {/* APP */}
      <SectionCard title="App">
        <SettingsRow icon={Bell} iconBg="oklch(0.72 0.14 75)" label="Notificaciones" onClick={() => goTo('notifications')} />
        <SettingsRow icon={Database} iconBg="oklch(0.50 0.10 240)" label="Datos" subtitle="Exportar, importar, borrar" onClick={() => goTo('data')} />
        <SettingsRow
          icon={ThemeIcon}
          iconBg="oklch(0.45 0 0)"
          label="Apariencia"
          subtitle={themeLabel}
          onClick={cycleTheme}
          right={
            <span className="text-xs text-muted-foreground">{themeLabel}</span>
          }
        />
      </SectionCard>

      {/* SOPORTE */}
      <SectionCard title="Soporte">
        <SettingsRow icon={HelpCircle} iconBg="oklch(0.55 0.13 255)" label="Ayuda y feedback" href="https://github.com/Demian-Burna/finanzas-personales/issues" />
        <SettingsRow icon={FileText} iconBg="oklch(0.50 0.08 200)" label="Términos y privacidad" href="#" />
      </SectionCard>

      {/* Cerrar sesión */}
      <button
        type="button"
        disabled={isSigningOut}
        onClick={() => startSignOut(async () => { await signOut() })}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 py-3.5 text-sm font-medium text-destructive',
          'hover:bg-destructive/10 transition-colors active:bg-destructive/20',
          isSigningOut && 'opacity-50 pointer-events-none',
        )}
      >
        <LogOut className="size-4" strokeWidth={1.75} />
        {isSigningOut ? 'Saliendo...' : 'Cerrar sesión'}
      </button>

      <p className="text-center text-[10px] text-muted-foreground/50">Finanzas Personales · v0.1.0</p>
    </div>
  )
}
