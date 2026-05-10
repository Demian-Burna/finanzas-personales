import type { BudgetWithProgress } from '@/lib/supabase/queries/budgets'
import { AlertBanner } from '@/components/shared/AlertBanner'

interface Props {
  budgets: BudgetWithProgress[]
  locale: string
}

export function AlertsSection({ budgets, locale }: Props) {
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
