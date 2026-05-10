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

      <Tabs defaultValue="profile" className="flex-col">
        <TabsList variant="line" className="w-full justify-start border-b rounded-none px-0 bg-transparent h-auto pb-0 gap-0">
          <TabsTrigger value="profile" className="rounded-none px-4 pb-3">Perfil</TabsTrigger>
          <TabsTrigger value="accounts" className="rounded-none px-4 pb-3">Cuentas</TabsTrigger>
          <TabsTrigger value="categories" className="rounded-none px-4 pb-3">Categorías</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-none px-4 pb-3">Notificaciones</TabsTrigger>
          <TabsTrigger value="data" className="rounded-none px-4 pb-3">Datos</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileTab profile={profile} userEmail={user?.email ?? null} />
        </TabsContent>

        <TabsContent value="accounts" className="mt-6">
          <AccountsTab accounts={accounts} accountTypes={accountTypes} currency={currency} />
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <CategoriesTab categories={categories} />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationsTab />
        </TabsContent>

        <TabsContent value="data" className="mt-6">
          <DataTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
