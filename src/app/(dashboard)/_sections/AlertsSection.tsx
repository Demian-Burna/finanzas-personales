import { createClient } from '@/lib/supabase/server'
import { getBudgetsWithProgress } from '@/lib/supabase/queries/budgets'
import { AlertBanner } from '@/components/shared/AlertBanner'

interface Props {
  referenceDate: string
  locale: string
}

export async function AlertsSection({ referenceDate, locale }: Props) {
  const supabase = await createClient()
  const { data: budgets } = await getBudgetsWithProgress(supabase, referenceDate)

  // Budgets at or above 80% of limit
  const budgetsOverLimit = budgets.filter(
    (b) => b.amount > 0 && b.spent_amount / b.amount >= 0.8,
  )

  return (
    <AlertBanner
      budgetsOverLimit={budgetsOverLimit}
      upcomingRecurring={[]}
      goalsNearTarget={[]}
      locale={locale}
    />
  )
}
