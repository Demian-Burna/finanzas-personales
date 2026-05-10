import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getAccounts } from '@/lib/supabase/queries/accounts'
import { getCategories } from '@/lib/supabase/queries/categories'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ProfileTab } from '@/components/settings/ProfileTab'
import { AccountsTab } from '@/components/settings/AccountsTab'
import { CategoriesTab } from '@/components/settings/CategoriesTab'
import { NotificationsTab } from '@/components/settings/NotificationsTab'
import { DataTab } from '@/components/settings/DataTab'

export const metadata: Metadata = { title: 'Configuración' }

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: _authData } = await supabase.auth.getUser(); const user = _authData?.user ?? null

  const [{ data: accounts }, { data: categories }] = await Promise.all([
    getAccounts(supabase),
    getCategories(supabase),
  ])

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('display_name,avatar_url,base_currency,locale,timezone')
    .single()

  const profile = profileRaw as {
    display_name: string | null
    avatar_url: string | null
    base_currency: string | null
    locale: string | null
    timezone: string | null
  } | null

  // Account types for the account form
  const { data: accountTypesRaw } = await supabase
    .from('account_types')
    .select('id,name,nature,icon')
    .order('name')

  const accountTypes = (accountTypesRaw as Array<{ id: string; name: string; nature: string; icon: string | null }> | null) ?? []

  const currency = profile?.base_currency ?? 'ARS'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">Preferencias de cuenta y aplicación</p>
      </div>

      <Tabs defaultValue="profile">
        {/* Desktop: sidebar nav + content. Mobile: tabs on top */}
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* Sidebar nav */}
          <aside className="lg:w-48 shrink-0">
            <TabsList variant="line" className="flex-col items-start w-full bg-transparent h-auto gap-0.5 border-0 p-0">
              <TabsTrigger value="profile"       className="w-full justify-start rounded-lg px-3 py-2 text-sm">Perfil</TabsTrigger>
              <TabsTrigger value="accounts"      className="w-full justify-start rounded-lg px-3 py-2 text-sm">Cuentas</TabsTrigger>
              <TabsTrigger value="categories"    className="w-full justify-start rounded-lg px-3 py-2 text-sm">Categorías</TabsTrigger>
              <TabsTrigger value="notifications" className="w-full justify-start rounded-lg px-3 py-2 text-sm">Notificaciones</TabsTrigger>
              <TabsTrigger value="data"          className="w-full justify-start rounded-lg px-3 py-2 text-sm">Datos</TabsTrigger>
            </TabsList>
          </aside>

          {/* Content area — takes all remaining space */}
          <div className="flex-1 min-w-0">
            <TabsContent value="profile">
              <ProfileTab profile={profile} userEmail={user?.email ?? null} />
            </TabsContent>

            <TabsContent value="accounts">
              <AccountsTab accounts={accounts} accountTypes={accountTypes} currency={currency} />
            </TabsContent>

            <TabsContent value="categories">
              <CategoriesTab categories={categories} />
            </TabsContent>

            <TabsContent value="notifications">
              <NotificationsTab />
            </TabsContent>

            <TabsContent value="data">
              <DataTab />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  )
}
