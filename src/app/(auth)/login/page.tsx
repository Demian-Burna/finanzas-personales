import type { Metadata } from 'next'
import { signInWithGoogle, signInWithMagicLink } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MagicLinkListener } from './MagicLinkListener'

export const metadata: Metadata = { title: 'Iniciar sesión' }

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

const ERROR_MESSAGES: Record<string, string> = {
  oauth_error: 'Error al conectar con Google. Intentá de nuevo.',
  auth_error: 'Error de autenticación. Intentá de nuevo.',
  magic_link_error: 'No pudimos enviar el email. Intentá de nuevo.',
  invalid_email: 'Ingresá un email válido.',
  invalid_link: 'El link es inválido o expiró.',
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
  } catch {
    // ignore
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-2xl text-primary-foreground shadow-sm">
            💰
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Finanzas Personales</h1>
            <p className="text-sm text-muted-foreground">Controlá tus finanzas de forma inteligente</p>
          </div>
        </div>

        <div className="space-y-4">
          {error && (
            <p className="rounded-lg bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
              {ERROR_MESSAGES[error] ?? 'Ocurrió un error. Intentá de nuevo.'}
            </p>
          )}

          <form action={signInWithGoogle}>
            <Button type="submit" variant="outline" size="lg" className="w-full gap-3 text-sm font-medium">
              <GoogleIcon />
              Continuar con Google
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">o</span>
            </div>
          </div>

          {magicSent ? (
            <div className="rounded-lg bg-muted px-4 py-4 text-center text-sm space-y-1">
              <MagicLinkListener />
              <p className="font-medium">Revisá tu bandeja de entrada</p>
              {sentEmail && (
                <p className="text-muted-foreground">
                  Te enviamos un link a <span className="font-medium text-foreground">{sentEmail}</span>
                </p>
              )}
            </div>
          ) : (
            <form action={signInWithMagicLink} className="space-y-2">
              <Input
                type="email"
                name="email"
                placeholder="tu@email.com"
                required
                autoComplete="email"
                className="text-sm"
              />
              <Button type="submit" variant="secondary" size="lg" className="w-full text-sm font-medium">
                Continuar con email
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          🔒 Tus datos son privados y solo vos los podés ver
        </p>
      </div>
    </div>
  )
}
