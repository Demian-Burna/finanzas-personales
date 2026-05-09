import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Overview',
}

export default function OverviewPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
      <p className="text-muted-foreground mt-2">Resumen de tus finanzas personales</p>
    </div>
  )
}
