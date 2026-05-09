import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Transacciones' }

export default function TransactionsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Transacciones</h1>
      <p className="text-muted-foreground mt-2">Historial de ingresos y gastos</p>
    </div>
  )
}
