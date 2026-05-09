import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar will go here */}
      <aside className="hidden w-64 border-r bg-sidebar lg:block">
        <div className="p-4">
          <p className="text-sidebar-foreground font-semibold">Finanzas Personales</p>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  )
}
