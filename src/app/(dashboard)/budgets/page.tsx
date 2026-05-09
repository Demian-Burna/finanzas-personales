import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Presupuestos' }

export default function BudgetsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Presupuestos</h1>
      <p className="text-muted-foreground mt-2">Gestiona tus límites de gasto por categoría</p>
    </div>
  )
}
