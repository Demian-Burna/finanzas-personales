import { Suspense } from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getAccounts } from '@/lib/supabase/queries/accounts'
import { getCategories } from '@/lib/supabase/queries/categories'
import { TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { SettingsTabs } from '@/components/settings/SettingsTabs'
import { SettingsMobileIndex } from '@/components/settings/SettingsMobileIndex'
import { SettingsMobileBackHeader } from '@/components/settings/SettingsMobileBackHeader'
import { ProfileTab } from '@/components/settings/ProfileTab'
import { AccountsTab } from '@/components/settings/AccountsTab'
import { CategoriesTab } from '@/components/settings/CategoriesTab'
import { NotificationsTab } from '@/components/settings/NotificationsTab'
import { DataTab } from '@/components/settings/DataTab'

export const metadata: Metadata = { title: 'Configuración' }

const TAB_LABELS: Record<string, string> = {
  profile:       'Perfil',
  accounts:      'Cuentas',
  categories:    'Categorías',
  notifications: 'Notificaciones',
  data:          'Datos',
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await Promise.resolve(searchParams)
  const tab = (Array.isArray(params['tab']) ? params['tab'][0] : params['tab']) ?? ''

  const supabase = await createClient()
  const { data: _authData } = await supabase.auth.getUser()
  const user = _authData?.user ?? null

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

  const { data: accountTypesRaw } = await supabase
    .from('account_types')
    .select('id,name,nature,icon')
    .order('name')

  const accountTypes = (accountTypesRaw as Array<{ id: string; name: string; nature: string; icon: string | null }> | null) ?? []
  const currency = profile?.currency_code ?? 'ARS'

  const tabTitle = TAB_LABELS[tab] ?? 'Configuración'

  return (
    <div>
      {/* Desktop title */}
      <div className="hidden lg:block">
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">Preferencias de cuenta y aplicación</p>
      </div>

      {/* ── Mobile ── */}
      <div className="lg:hidden">
        {tab ? (
          /* Detail view */
          <>
            <Suspense fallback={null}>
              <SettingsMobileBackHeader title={tabTitle} />
            </Suspense>
            {tab === 'profile'       && <ProfileTab profile={profile} userEmail={user?.email ?? null} />}
            {tab === 'accounts'      && <AccountsTab accounts={accounts} accountTypes={accountTypes} currency={currency} />}
            {tab === 'categories'    && <CategoriesTab categories={categories} />}
            {tab === 'notifications' && <NotificationsTab />}
            {tab === 'data'          && <DataTab />}
          </>
        ) : (
          /* Index view */
          <Suspense fallback={null}>
            <SettingsMobileIndex user={user} profile={profile} />
          </Suspense>
        )}
      </div>

      {/* ── Desktop: sidebar tabs (unchanged) ── */}
      <SettingsTabs>
        <div className="hidden lg:flex flex-col gap-6 lg:flex-row lg:gap-8">
          <aside className="lg:w-40 shrink-0">
            <TabsList variant="line" className="flex-col items-start w-full bg-transparent h-auto gap-0.5 border-0 p-0">
              <TabsTrigger value="profile"       className="w-full justify-start rounded-lg px-3 py-2 text-sm font-medium">Perfil</TabsTrigger>
              <TabsTrigger value="accounts"      className="w-full justify-start rounded-lg px-3 py-2 text-sm font-medium">Cuentas</TabsTrigger>
              <TabsTrigger value="categories"    className="w-full justify-start rounded-lg px-3 py-2 text-sm font-medium">Categorías</TabsTrigger>
              <TabsTrigger value="notifications" className="w-full justify-start rounded-lg px-3 py-2 text-sm font-medium">Notificaciones</TabsTrigger>
              <TabsTrigger value="data"          className="w-full justify-start rounded-lg px-3 py-2 text-sm font-medium">Datos</TabsTrigger>
            </TabsList>
          </aside>

          <div className="flex-1 min-w-0 w-full max-w-2xl lg:max-w-none">
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
