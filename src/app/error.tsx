'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8">
          <h2 className="text-2xl font-bold">Algo salió mal</h2>
          <p className="text-muted-foreground text-sm">{error.message}</p>
          {error.digest && <p className="text-xs text-muted-foreground font-mono">ID: {error.digest}</p>}
          <button onClick={reset} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  )
}
