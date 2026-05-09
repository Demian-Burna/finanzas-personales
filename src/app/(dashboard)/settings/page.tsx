import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Configuración' }

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
      <p className="text-muted-foreground mt-2">Preferencias de cuenta y aplicación</p>
    </div>
  )
}
