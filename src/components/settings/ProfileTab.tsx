'use client'

import { useRef, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { toast } from 'sonner'
import { Camera, LogOut, Sun, Moon } from 'lucide-react'
import { useTransition as useSignOutTransition } from 'react'
import { useTheme } from 'next-themes'
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
    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 max-w-2xl">

      {/* Card: identity */}
      <div className="rounded-xl border bg-card p-4 shadow-sm space-y-4">
        {/* Avatar row */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Avatar" className="size-16 rounded-full object-cover ring-2 ring-border" referrerPolicy="no-referrer" />
            ) : (
              <span className="flex size-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                {initials}
              </span>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 flex size-6 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-muted transition-colors"
            >
              <Camera className="size-3" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} disabled={isUploading} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{profile?.display_name ?? userEmail}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Máx. 2 MB · JPG, PNG, WebP</p>
          </div>
        </div>

        {/* Name */}
        <div>
          <Label>Nombre</Label>
          <Input placeholder="Tu nombre" {...form.register('display_name')} className="mt-1 w-full" />
          {form.formState.errors.display_name && (
            <p className="mt-1 text-xs text-destructive">{form.formState.errors.display_name.message}</p>
          )}
        </div>
      </div>

      {/* Card: app preferences */}
      <div className="rounded-xl border bg-card p-4 shadow-sm space-y-4">
        {/* Currency */}
        <div>
          <Label>Moneda base</Label>
          <Controller
            control={form.control}
            name="currency_code"
            render={({ field }) => (
              <CurrencySelect value={field.value} onValueChange={field.onChange} className="mt-1 w-full" />
            )}
          />
        </div>

        {/* Locale */}
        <div>
          <Label>Formato regional</Label>
          <Controller control={form.control} name="locale" render={({ field }) => (
            <Select value={field.value ?? 'es-AR'} onValueChange={field.onChange}>
              <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LOCALES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
        </div>

        {/* Timezone */}
        <div>
          <Label>Zona horaria</Label>
          <Controller control={form.control} name="timezone" render={({ field }) => (
            <Select value={field.value ?? 'America/Argentina/Buenos_Aires'} onValueChange={field.onChange}>
              <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz.replace(/_/g, ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
        </div>
      </div>

      {/* Save */}
      <Button type="submit" disabled={isPending || isUploading}>
        {isPending ? 'Guardando...' : 'Guardar cambios'}
      </Button>

      {/* Mobile-only: theme toggle + sign out (same card style as Notifications) */}
      <div className="lg:hidden space-y-2 pt-2 border-t">
        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
        >
          {resolvedTheme === 'dark' ? <Sun className="size-4 shrink-0" /> : <Moon className="size-4 shrink-0" />}
          <span>{resolvedTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}</span>
        </button>
        <button
          type="button"
          disabled={isSigningOut}
          onClick={() => startSignOut(async () => { await signOut() })}
          className="flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm font-medium shadow-sm text-destructive transition-colors hover:bg-destructive/5"
        >
          <LogOut className="size-4 shrink-0" />
          <span>{isSigningOut ? 'Saliendo...' : 'Cerrar sesión'}</span>
        </button>
      </div>
    </form>
  )
}
