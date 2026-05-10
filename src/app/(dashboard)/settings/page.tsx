import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getAccounts } from '@/lib/supabase/queries/accounts'
import { getCategories } from '@/lib/supabase/queries/categories'
import { TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { SettingsTabs } from '@/components/settings/SettingsTabs'
import { ProfileTab } from '@/components/settings/ProfileTab'
import { AccountsTab } from '@/components/settings/AccountsTab'
import { CategoriesTab } from '@/components/settings/CategoriesTab'
import { NotificationsTab } from '@/components/settings/NotificationsTab'
import { DataTab } from '@/components/settings/DataTab'

export const metadata: Metadata = { title: 'Configuración' }

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>
}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _params = await Promise.resolve(searchParams) // consumed by SettingsTabs client component
  const supabase = await createClient()

  const { data: _authData } = await supabase.auth.getUser(); const user = _authData?.user ?? null

  const [{ data: accounts }, { data: categories }] = await Promise.all([
    getAccounts(supabase),
    getCategories(supabase),
  ])

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('display_name,avatar_url,currency_code,locale,timezone')
    .single()

  const profile = profileRaw as {
    display_name: string | null
    avatar_url: string | null
    currency_code: string | null
    locale: string | null
    timezone: string | null
  } | null

  // Account types for the account form
  const { data: accountTypesRaw } = await supabase
    .from('account_types')
    .select('id,name,nature,icon')
    .order('name')

  const accountTypes = (accountTypesRaw as Array<{ id: string; name: string; nature: string; icon: string | null }> | null) ?? []

  const currency = profile?.currency_code ?? 'ARS'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">Preferencias de cuenta y aplicación</p>
      </div>

      <SettingsTabs>
        {/* Desktop: sidebar nav + content. Mobile: scrollable tab bar at top */}
        <div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
          {/* Nav — horizontal scroll on mobile, vertical sidebar on desktop */}
          <aside className="shrink-0 lg:w-40">
            <TabsList variant="line" className="
              flex flex-row gap-1 overflow-x-auto w-full h-auto rounded-xl border bg-muted/30 p-1
              lg:flex-col lg:overflow-visible lg:gap-0.5 lg:border-0 lg:bg-transparent lg:rounded-none lg:p-0
            ">
              <TabsTrigger value="profile"       className="whitespace-nowrap shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium lg:w-full lg:justify-start lg:py-2">Perfil</TabsTrigger>
              <TabsTrigger value="accounts"      className="whitespace-nowrap shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium lg:w-full lg:justify-start lg:py-2">Cuentas</TabsTrigger>
              <TabsTrigger value="categories"    className="whitespace-nowrap shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium lg:w-full lg:justify-start lg:py-2">Categorías</TabsTrigger>
              <TabsTrigger value="notifications" className="whitespace-nowrap shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium lg:w-full lg:justify-start lg:py-2">Notificaciones</TabsTrigger>
              <TabsTrigger value="data"          className="whitespace-nowrap shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium lg:w-full lg:justify-start lg:py-2">Datos</TabsTrigger>
            </TabsList>
          </aside>

          {/* Content area — full remaining width, no max-w restriction */}
          <div className="flex-1 min-w-0 w-full">
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
      </SettingsTabs>
    </div>
  )
}
