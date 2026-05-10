import { createClient } from '@/lib/supabase/server'
import { getAccounts } from '@/lib/supabase/queries/accounts'
import { AccountsSection as AccountsSectionUI, AccountsSkeleton } from '@/components/shared/AccountCard'

interface Props {
  locale: string
}

export async function AccountsSection({ locale }: Props) {
  const supabase = await createClient()
  const { data: accounts } = await getAccounts(supabase)

  if (!accounts.length) {
    return <AccountsSkeleton />
  }

  return <AccountsSectionUI accounts={accounts} locale={locale} />
}

export { AccountsSkeleton }
