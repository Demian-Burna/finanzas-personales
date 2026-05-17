'use client'

import { ErrorScreen } from '@/components/shared/ErrorScreen'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const refCode = error.digest
    ? `ERR-${error.digest.slice(0, 8).toUpperCase()}`
    : `ERR-${Math.random().toString(36).slice(2, 10).toUpperCase()}`

  return (
    <html>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ErrorScreen
          icon={<span className="flex size-[72px] items-center justify-center rounded-[22px] bg-destructive/15 text-destructive text-3xl font-bold">!</span>}
          title="Algo se rompió de nuestro lado"
          body="Hubo un problema procesando tu pedido. Ya lo registramos y lo estamos mirando."
          actions={[
            { label: 'Intentar de nuevo', onClick: reset },
            { label: 'Volver al inicio', href: '/' },
          ]}
          refCode={refCode}
        />
      </body>
    </html>
  )
}
