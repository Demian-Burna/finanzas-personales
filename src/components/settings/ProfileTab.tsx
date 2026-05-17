'use client'

import { useRef, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { toast } from 'sonner'
import { useTransition as useSignOutTransition } from 'react'
import { useTheme } from 'next-themes'
import { ChevronRight } from 'lucide-react'
import { signOut } from '@/app/(dashboard)/actions'
import { profileSchema, type ProfileInput } from '@/lib/validations/profile'
import { Button } from '@/components/ui/button'
import { CurrencySelect } from '@/components/shared/CurrencySelect'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateProfileAction, uploadAvatarAction } from '@/app/(dashboard)/settings/actions'

const TIMEZONES = [
  'America/Argentina/Buenos_Aires', 'America/Bogota', 'America/Lima',
  'America/Santiago', 'America/Mexico_City', 'America/New_York',
  'Europe/Madrid', 'UTC',
]

const LOCALES = [
  { value: 'es-AR', label: 'Español (Argentina)' },
  { value: 'es-ES', label: 'Español (España)' },
  { value: 'es-MX', label: 'Español (México)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'pt-BR', label: 'Português (Brasil)' },
]

interface Props {
  profile: {
    display_name: string | null
    avatar_url: string | null
    currency_code: string | null
    locale: string | null
    timezone: string | null
  } | null
  userEmail: string | null
}

function SectionCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      {title && <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>}
      <div className="overflow-hidden rounded-xl border bg-card">{children}</div>
    </section>
  )
}

export function ProfileTab({ profile, userEmail }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [isUploading, startUpload] = useTransition()
  const [isSigningOut, startSignOut] = useSignOutTransition()
  const { resolvedTheme, setTheme } = useTheme()

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema) as Resolver<ProfileInput>,
    defaultValues: {
      display_name: profile?.display_name ?? '',
      avatar_url: profile?.avatar_url ?? null,
      currency_code: profile?.currency_code ?? 'ARS',
      locale: profile?.locale ?? 'es-AR',
      timezone: profile?.timezone ?? 'America/Argentina/Buenos_Aires',
    },
  })

  const avatarUrl = form.watch('avatar_url')
  const initials = (profile?.display_name ?? userEmail ?? '?')[0]?.toUpperCase() ?? '?'

  function handleSave(values: ProfileInput) {
    startTransition(async () => {
      const res = await updateProfileAction(values)
      if (!res.ok) toast.error(res.error)
      else toast.success('Perfil actualizado')
    })
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('avatar', file)
    startUpload(async () => {
      const res = await uploadAvatarAction(fd)
      if (!res.ok) { toast.error(res.error); return }
      form.setValue('avatar_url', res.data.url)
      toast.success('Avatar actualizado')
    })
  }

  return (
    <form onSubmit={form.handleSubmit(handleSave)} className="max-w-2xl">
      {/* ── Mobile iOS-style layout ── */}
      <div className="lg:hidden px-4 pt-4 pb-6">
        {/* Avatar — centered */}
        <div className="flex flex-col items-center gap-2 py-4 pb-6">
          <div className="relative">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Avatar" className="size-20 rounded-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="flex size-20 items-center justify-center rounded-full bg-foreground text-3xl font-bold text-background">
                {initials}
              </span>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 flex size-7 items-center justify-center rounded-full border-2 border-background bg-muted shadow-sm hover:bg-muted/80 transition-colors"
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} disabled={isUploading} />
          </div>
          <button type="button" onClick={() => fileRef.current?.click()} className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
            Cambiar foto
          </button>
        </div>

        <SectionCard title="Información">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <div className="w-28 text-sm text-muted-foreground shrink-0">Nombre</div>
            <input
              defaultValue={profile?.display_name ?? ''}
              {...form.register('display_name')}
              className="flex-1 text-sm font-medium text-right bg-transparent border-0 outline-none text-foreground"
            />
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-28 text-sm text-muted-foreground shrink-0">Email</div>
            <div className="flex-1 text-sm text-muted-foreground text-right">{userEmail}</div>
          </div>
        </SectionCard>

        <SectionCard title="Preferencias">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <div className="w-28 text-sm text-muted-foreground shrink-0">Moneda base</div>
            <Controller
              control={form.control}
              name="currency_code"
              render={({ field }) => (
                <CurrencySelect value={field.value} onValueChange={field.onChange} className="flex-1 text-right border-0 bg-transparent text-sm font-medium h-auto p-0 shadow-none" />
              )}
            />
          </div>
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <div className="w-28 text-sm text-muted-foreground shrink-0">Formato</div>
            <Controller
              control={form.control}
              name="locale"
              render={({ field }) => (
                <select value={field.value ?? 'es-AR'} onChange={e => field.onChange(e.target.value)} className="flex-1 text-sm font-medium text-right bg-transparent border-0 outline-none text-foreground">
                  {LOCALES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              )}
            />
            <ChevronRight className="size-4 text-muted-foreground/50 shrink-0" />
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-28 text-sm text-muted-foreground shrink-0">Zona horaria</div>
            <Controller
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <select value={field.value ?? 'America/Argentina/Buenos_Aires'} onChange={e => field.onChange(e.target.value)} className="flex-1 text-sm font-medium text-right bg-transparent border-0 outline-none text-foreground">
                  {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
                </select>
              )}
            />
            <ChevronRight className="size-4 text-muted-foreground/50 shrink-0" />
          </div>
        </SectionCard>

        <Button type="submit" className="w-full" disabled={isPending || isUploading}>
          {isPending ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>

      {/* ── Desktop layout (unchanged) ── */}
      <div className="hidden lg:block space-y-4">
        <div className="rounded-xl border bg-card p-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Avatar" className="size-16 rounded-full object-cover ring-2 ring-border" referrerPolicy="no-referrer" />
              ) : (
                <span className="flex size-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">{initials}</span>
              )}
              <button type="button" onClick={() => fileRef.current?.click()} className="absolute bottom-0 right-0 flex size-6 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-muted transition-colors">
                <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} disabled={isUploading} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{profile?.display_name ?? userEmail}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>
          </div>
          <div>
            <Label>Nombre</Label>
            <Input placeholder="Tu nombre" {...form.register('display_name')} className="mt-1 w-full" />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-4">
          <div>
            <Label>Moneda base</Label>
            <Controller control={form.control} name="currency_code" render={({ field }) => (
              <CurrencySelect value={field.value} onValueChange={field.onChange} className="mt-1 w-full" />
            )} />
          </div>
          <div>
            <Label>Formato regional</Label>
            <Controller control={form.control} name="locale" render={({ field }) => (
              <Select value={field.value ?? 'es-AR'} onValueChange={field.onChange}>
                <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{LOCALES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
            )} />
          </div>
          <div>
            <Label>Zona horaria</Label>
            <Controller control={form.control} name="timezone" render={({ field }) => (
              <Select value={field.value ?? 'America/Argentina/Buenos_Aires'} onValueChange={field.onChange}>
                <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            )} />
          </div>
        </div>

        <Button type="submit" disabled={isPending || isUploading}>
          {isPending ? 'Guardando...' : 'Guardar cambios'}
        </Button>

        <div className="hidden lg:block space-y-2 pt-2 border-t">
          <button type="button" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} className="flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm font-medium hover:bg-muted transition-colors">
            {resolvedTheme === 'dark' ? '☀️' : '🌙'} {resolvedTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          </button>
          <button type="button" disabled={isSigningOut} onClick={() => startSignOut(async () => { await signOut() })} className="flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors">
            {isSigningOut ? 'Saliendo...' : 'Cerrar sesión'}
          </button>
        </div>
      </div>
    </form>
  )
}
