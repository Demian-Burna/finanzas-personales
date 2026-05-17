import type { Metadata } from 'next'
import { signInWithGoogle, signInWithMagicLink } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MagicLinkListener } from './MagicLinkListener'

export const metadata: Metadata = { title: 'Iniciar sesión' }

function GoogleIcon() {
  return (
    <svg className="size-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

const ERROR_MESSAGES: Record<string, string> = {
  oauth_error:       'Error al conectar con Google. Intentá de nuevo.',
  auth_error:        'Error de autenticación. Intentá de nuevo.',
  magic_link_error:  'No pudimos enviar el email. Intentá de nuevo.',
  invalid_email:     'Ingresá un email válido.',
  invalid_link:      'El link es inválido o expiró.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>
}) {
  let error: string | undefined
  let magicSent = false
  let sentEmail: string | undefined

  try {
    const params = await Promise.resolve(searchParams)
    const raw = params?.error
    error = Array.isArray(raw) ? raw[0] : raw
    magicSent = params?.magic_sent === '1'
    const rawEmail = params?.email
    sentEmail = Array.isArray(rawEmail) ? rawEmail[0] : rawEmail
  } catch { /* ignore */ }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <MagicLinkListener />

      <div className="w-full max-w-sm space-y-8">
        {/* Logo + tagline */}
        <div className="space-y-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-icono.svg"
            alt="Finanzas Personales"
            width={64}
            height={64}
            className="mx-auto"
          />
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Tus finanzas, claras</h1>
            <p className="text-sm text-muted-foreground">Entrá para seguir gestionando</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="rounded-xl bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
            {ERROR_MESSAGES[error] ?? 'Ocurrió un error. Intentá de nuevo.'}
          </p>
        )}

        {/* Magic link form or sent state */}
        {magicSent ? (
          <div className="rounded-xl border bg-muted/40 px-5 py-5 text-center space-y-1.5">
            <p className="text-sm font-semibold">Revisá tu bandeja de entrada</p>
            {sentEmail && (
              <p className="text-xs-plus text-muted-foreground">
                Enviamos un link a{' '}
                <span className="font-medium text-foreground">{sentEmail}</span>
              </p>
            )}
          </div>
        ) : (
          <form action={signInWithMagicLink} className="space-y-3">
            <Input
              type="email"
              name="email"
              placeholder="tu@email.com"
              required
              autoComplete="email"
              className="h-11 text-sm rounded-xl"
            />
            <Button type="submit" size="lg" className="w-full rounded-xl text-sm font-semibold h-11">
              Iniciar sesión
            </Button>
          </form>
        )}

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-3 text-muted-foreground">O continuá con</span>
          </div>
        </div>

        {/* Google */}
        <form action={signInWithGoogle}>
          <Button
            type="submit"
            variant="outline"
            size="lg"
            className="w-full gap-3 rounded-xl h-11 text-sm font-medium"
          >
            <GoogleIcon />
            Google
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Tus datos son privados y solo vos los podés ver
        </p>
      </div>
    </div>
  )
}
