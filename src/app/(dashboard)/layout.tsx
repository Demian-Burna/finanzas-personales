import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

// All dashboard routes require auth and use cookies — prevent static pre-rendering
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { NotificationsDrawer } from '@/components/shared/NotificationsDrawer'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let user = null

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch (err) {
    console.error('[layout] getUser error:', err)
  }

  if (!user) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={user} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile-only header — 64px reserved via pt-16 on main */}
        <MobileHeader user={user} />
        <main className="flex-1 overflow-y-auto p-4 pt-4 pb-20 lg:p-6 lg:pb-6 lg:pt-6">
          {children}
        </main>
      </div>
      <MobileNav user={user} />
      <NotificationsDrawer />
    </div>
  )
}
