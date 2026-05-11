'use client'

export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <img src="/logo-icono.svg" alt="Finanzas Personales" width={56} height={56} className="mx-auto" />
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Error al cargar</h2>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          {error.digest && <p className="text-xs font-mono text-muted-foreground">ID: {error.digest}</p>}
        </div>
        <button onClick={reset} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
          Reintentar
        </button>
      </div>
    </div>
  )
}
