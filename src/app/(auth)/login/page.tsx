import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Iniciar sesión' }

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Finanzas Personales</h1>
          <p className="text-muted-foreground">Inicia sesión para continuar</p>
        </div>
        {/* LoginForm will go here */}
      </div>
    </div>
  )
}
