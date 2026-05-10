import type { AccountWithType } from '@/lib/supabase/queries/accounts'
import { AccountsSection as AccountsSectionUI, AccountsSkeleton } from '@/components/shared/AccountCard'

interface Props {
  accounts: AccountWithType[]
  locale: string
}

export function AccountsSection({ accounts, locale }: Props) {
  if (!accounts.length) {
    return <AccountsSkeleton />
  }
  return <AccountsSectionUI accounts={accounts} locale={locale} />
}

export { AccountsSkeleton }
