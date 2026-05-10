// ============================================================
// Domain types — narrowed enums + JSON shapes + table aliases
// ============================================================
// The auto-generated `database.ts` types CHECK-constrained columns
// (e.g. transaction_type, period_type) as plain `string` because
// PostgreSQL CHECK constraints don't surface as TypeScript enums.
//
// This module re-exports each Row/Insert/Update with those columns
// narrowed to the actual allowed string-literal unions, so consumers
// get full IntelliSense and exhaustive-switch type-checking.
// ============================================================

import type { Database, Tables, TablesInsert, TablesUpdate } from './database'

// ── Domain string-literal enums ─────────────────────────────
export type TransactionType = 'income' | 'expense' | 'transfer'

export type BudgetPeriod = 'monthly' | 'weekly' | 'yearly' | 'custom'

export type RecurringFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'bimonthly'
  | 'quarterly'
  | 'yearly'

export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled'

export type AccountNature = 'asset' | 'liability'

export type AccountTypeName =
  | 'checking'
  | 'savings'
  | 'credit_card'
  | 'investment'
  | 'cash'
  | 'loan'

export type NotificationType =
  | 'budget_alert'
  | 'recurring_reminder'
  | 'goal_milestone'
  | 'goal_completed'
  | 'low_balance'
  | 'monthly_summary'

export type NotificationChannel = 'in_app' | 'email'

export type RelatedEntityType = 'budget' | 'recurring_item' | 'goal' | 'transaction'

// Fixed account_type UUIDs (seeded in migration 001).
// Lets the app reference an account type without a lookup query.
export const ACCOUNT_TYPE_IDS = {
  checking:    '00000000-0000-0000-0000-000000000001',
  savings:     '00000000-0000-0000-0000-000000000002',
  credit_card: '00000000-0000-0000-0000-000000000003',
  investment:  '00000000-0000-0000-0000-000000000004',
  cash:        '00000000-0000-0000-0000-000000000005',
  loan:        '00000000-0000-0000-0000-000000000006',
} as const satisfies Record<AccountTypeName, string>

// Single transfer category (seeded in seed.sql).
export const TRANSFER_CATEGORY_ID = '00000000-0000-0000-0005-000000000001' as const

// ── JSONB shapes ─────────────────────────────────────────────
export interface MonthlySnapshotData {
  categories: Array<{
    id: string
    name: string
    income: number
    expenses: number
  }>
  accounts: Array<{
    id: string
    name: string
    balance: number
    type: AccountNature
  }>
  topExpenses: Array<{
    category_id: string
    name: string
    amount: number
    pct: number
  }>
}

// ── Narrowed Row/Insert/Update aliases ───────────────────────
// Pattern: Omit the `string` field, then re-add it with the union.
// Result: the narrowed type is structurally compatible with the raw
// generated type (it's a subtype) so it can still be passed to
// supabase-js builders.

type Narrow<T, K extends keyof T, V extends T[K]> = Omit<T, K> & Record<K, V>

// account_types
export type AccountTypeRow = Narrow<Tables<'account_types'>, 'nature', AccountNature>
export type AccountTypeInsert = Narrow<TablesInsert<'account_types'>, 'nature', AccountNature>
export type AccountTypeUpdate = TablesUpdate<'account_types'> & { nature?: AccountNature }

// accounts
export type AccountRow = Tables<'accounts'>
export type AccountInsert = TablesInsert<'accounts'>
export type AccountUpdate = TablesUpdate<'accounts'>

// budgets
export type BudgetRow = Narrow<Tables<'budgets'>, 'period_type', BudgetPeriod>
export type BudgetInsert = Narrow<TablesInsert<'budgets'>, 'period_type', BudgetPeriod>
export type BudgetUpdate = TablesUpdate<'budgets'> & { period_type?: BudgetPeriod }

// categories
export type CategoryRow = Narrow<Tables<'categories'>, 'transaction_type', TransactionType>
export type CategoryInsert = Narrow<TablesInsert<'categories'>, 'transaction_type', TransactionType>
export type CategoryUpdate = TablesUpdate<'categories'> & { transaction_type?: TransactionType }

// currencies
export type CurrencyRow = Tables<'currencies'>
export type CurrencyInsert = TablesInsert<'currencies'>
export type CurrencyUpdate = TablesUpdate<'currencies'>

// exchange_rates
export type ExchangeRateRow = Tables<'exchange_rates'>
export type ExchangeRateInsert = TablesInsert<'exchange_rates'>
export type ExchangeRateUpdate = TablesUpdate<'exchange_rates'>

// goal_contributions
export type GoalContributionRow = Tables<'goal_contributions'>
export type GoalContributionInsert = TablesInsert<'goal_contributions'>
export type GoalContributionUpdate = TablesUpdate<'goal_contributions'>

// monthly_snapshots
export type MonthlySnapshotRow =
  Omit<Tables<'monthly_snapshots'>, 'data'> & { data: MonthlySnapshotData | null }
export type MonthlySnapshotInsert =
  Omit<TablesInsert<'monthly_snapshots'>, 'data'> & { data?: MonthlySnapshotData | null }
export type MonthlySnapshotUpdate =
  Omit<TablesUpdate<'monthly_snapshots'>, 'data'> & { data?: MonthlySnapshotData | null }

// notification_preferences
export type NotificationPreferenceRow = Narrow<
  Narrow<Tables<'notification_preferences'>, 'notification_type', NotificationType>,
  'channel',
  NotificationChannel
>
export type NotificationPreferenceInsert = Narrow<
  Narrow<TablesInsert<'notification_preferences'>, 'notification_type', NotificationType>,
  'channel',
  NotificationChannel
>
export type NotificationPreferenceUpdate = TablesUpdate<'notification_preferences'> & {
  notification_type?: NotificationType
  channel?: NotificationChannel
}

// notifications
export type NotificationRow = Narrow<Tables<'notifications'>, 'type', NotificationType>
export type NotificationInsert = Narrow<TablesInsert<'notifications'>, 'type', NotificationType>
export type NotificationUpdate = TablesUpdate<'notifications'> & { type?: NotificationType }

// profiles
export type ProfileRow = Tables<'profiles'>
export type ProfileInsert = TablesInsert<'profiles'>
export type ProfileUpdate = TablesUpdate<'profiles'>

// recurring_items
export type RecurringItemRow = Narrow<
  Narrow<Tables<'recurring_items'>, 'transaction_type', TransactionType>,
  'frequency',
  RecurringFrequency
>
export type RecurringItemInsert = Narrow<
  Narrow<TablesInsert<'recurring_items'>, 'transaction_type', TransactionType>,
  'frequency',
  RecurringFrequency
>
export type RecurringItemUpdate = TablesUpdate<'recurring_items'> & {
  transaction_type?: TransactionType
  frequency?: RecurringFrequency
}

// saving_goals
export type SavingGoalRow = Narrow<Tables<'saving_goals'>, 'status', GoalStatus>
export type SavingGoalInsert = Narrow<TablesInsert<'saving_goals'>, 'status', GoalStatus>
export type SavingGoalUpdate = TablesUpdate<'saving_goals'> & { status?: GoalStatus }

// tags
export type TagRow = Tables<'tags'>
export type TagInsert = TablesInsert<'tags'>
export type TagUpdate = TablesUpdate<'tags'>

// transaction_tags
export type TransactionTagRow = Tables<'transaction_tags'>
export type TransactionTagInsert = TablesInsert<'transaction_tags'>
export type TransactionTagUpdate = TablesUpdate<'transaction_tags'>

// transactions
export type TransactionRow = Narrow<Tables<'transactions'>, 'transaction_type', TransactionType>
export type TransactionInsert = Narrow<
  TablesInsert<'transactions'>,
  'transaction_type',
  TransactionType
>
export type TransactionUpdate = TablesUpdate<'transactions'> & {
  transaction_type?: TransactionType
}

// ── Convenience generic aliases (legacy: <table> string keys) ─
type PublicTables = Database['public']['Tables']
export type Row<T extends keyof PublicTables> = Tables<T>
export type Insert<T extends keyof PublicTables> = TablesInsert<T>
export type Update<T extends keyof PublicTables> = TablesUpdate<T>

// ── Joined / projected types used across queries ────────────
// Transaction with eager category and account joins.
export type TransactionWithRelations = TransactionRow & {
  category: Pick<CategoryRow, 'id' | 'name' | 'color' | 'icon' | 'transaction_type'> | null
  account: Pick<AccountRow, 'id' | 'name' | 'icon' | 'color' | 'currency_code'>
  transfer_account: Pick<AccountRow, 'id' | 'name' | 'icon' | 'color' | 'currency_code'> | null
}

// Account joined with its account_type (for nature, icon, sort).
export type AccountWithType = AccountRow & {
  account_type: Pick<AccountTypeRow, 'id' | 'name' | 'nature' | 'icon' | 'sort_order'>
}

// Budget with computed period spend (filled by query).
export type BudgetWithProgress = BudgetRow & {
  category: Pick<CategoryRow, 'id' | 'name' | 'color' | 'icon'>
  spent_amount: number
  period_start: string
  period_end: string
  days_elapsed: number
  days_in_period: number
  projected_total: number
}
