import type { Metadata } from 'next'
import { signInWithGoogle, signInWithMagicLink } from './actions'
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
  let sessionExpired = false

  try {
    const params = await Promise.resolve(searchParams)
    const raw = params?.error
    error = Array.isArray(raw) ? raw[0] : raw
    magicSent = params?.magic_sent === '1'
    const rawEmail = params?.email
    sentEmail = Array.isArray(rawEmail) ? rawEmail[0] : rawEmail
    sessionExpired = params?.reason === 'expired'
  } catch { /* ignore */ }

  if (sessionExpired) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-8 text-center">
        <div className="flex size-[72px] items-center justify-center rounded-[22px] bg-muted mb-7 text-3xl">⏱</div>
        <h1 className="text-xl font-bold">Tu sesión expiró</h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-xs leading-relaxed">
          Por seguridad, cerramos tu sesión después de un rato sin actividad. Entrá de nuevo para seguir.
        </p>
        <div className="mt-8 w-full max-w-xs space-y-3">
          <a href="/login" className="flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            Iniciar sesión
          </a>
          <a href="/" className="flex h-12 w-full items-center justify-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Recordarme mañana
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-7" style={{ paddingTop: 0 }}>
      <MagicLinkListener />

      <div className="flex flex-1 flex-col" style={{ paddingTop: '10svh' }}>
        {/* Logo + tagline */}
        <div className="flex flex-col items-center gap-3.5 pb-9">
          <span
            className="flex size-16 items-center justify-center rounded-[18px] text-[28px] font-bold"
            style={{ background: 'var(--foreground)', color: 'var(--background)', letterSpacing: '-0.02em' }}
          >
            $
          </span>
          <div className="text-center">
            <div className="text-2xl font-bold tracking-tight" style={{ letterSpacing: '-0.02em' }}>Tus finanzas, claras</div>
            <div className="text-sm text-muted-foreground mt-1">Entrá para seguir gestionando</div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
            {ERROR_MESSAGES[error] ?? 'Ocurrió un error. Intentá de nuevo.'}
          </p>
        )}

        {/* Form */}
        {magicSent ? (
          <div className="rounded-xl border bg-muted/40 px-5 py-5 text-center space-y-1.5 mb-4">
            <p className="text-sm font-semibold">Revisá tu bandeja de entrada</p>
            {sentEmail && (
              <p className="text-xs text-muted-foreground">
                Enviamos un link a <span className="font-medium text-foreground">{sentEmail}</span>
              </p>
            )}
          </div>
        ) : (
          <form action={signInWithMagicLink} className="space-y-3 mb-4">
            {/* Email field — floating label style */}
            <div className="rounded-xl border px-4" style={{ paddingTop: 4, paddingBottom: 0 }}>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-1.5">Email</div>
              <input
                type="email"
                name="email"
                placeholder="matias@gmail.com"
                required
                autoComplete="email"
                className="w-full border-0 bg-transparent py-2 text-[15px] text-foreground outline-none placeholder:text-muted-foreground/50"
                style={{ fontFamily: 'inherit' }}
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl py-3.5 text-[15px] font-semibold transition-colors"
              style={{ background: 'var(--foreground)', color: 'var(--background)' }}
            >
              Iniciar sesión
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">O continuá con</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* OAuth buttons */}
        <div className="space-y-2">
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-xl border py-3 text-sm font-medium hover:bg-muted transition-colors"
              style={{ fontFamily: 'inherit' }}
            >
              <GoogleIcon />
              Google
            </button>
          </form>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-3 rounded-xl border py-3 text-sm font-medium hover:bg-muted transition-colors"
            style={{ fontFamily: 'inherit' }}
          >
            <span className="text-base">🍎</span>
            Apple
          </button>
        </div>

        <div className="mt-auto py-8 text-center text-[13px] text-muted-foreground">
          ¿Primera vez?{' '}
          <span className="font-medium" style={{ color: 'var(--accent)' }}>Crear cuenta</span>
        </div>
      </div>
    </div>
  )
}
