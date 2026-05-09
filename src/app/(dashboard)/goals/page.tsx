import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Metas' }

export default function GoalsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Metas Financieras</h1>
      <p className="text-muted-foreground mt-2">Seguimiento de tus objetivos de ahorro</p>
    </div>
  )
}
