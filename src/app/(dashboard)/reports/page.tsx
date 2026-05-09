import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Reportes' }

export default function ReportsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
      <p className="text-muted-foreground mt-2">Análisis y visualización de tus finanzas</p>
    </div>
  )
}
