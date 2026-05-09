import type { Row, Insert, Update } from '@/types/database'

// ── Runtime const objects for use in application code ────────
// (TypeScript string-literal union types can't be iterated at runtime)

export const TransactionType = {
  INCOME: 'income',
  EXPENSE: 'expense',
  TRANSFER: 'transfer',
} as const

export const BudgetPeriod = {
  MONTHLY: 'monthly',
  WEEKLY: 'weekly',
  YEARLY: 'yearly',
  CUSTOM: 'custom',
} as const

export const RecurringFrequency = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
  MONTHLY: 'monthly',
  BIMONTHLY: 'bimonthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
} as const

export const GoalStatus = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
} as const

export const AccountNature = {
  ASSET: 'asset',
  LIABILITY: 'liability',
} as const

// ── Narrowed convenience types ────────────────────────────────
export type TransactionRow    = Row<'transactions'>
export type TransactionInsert = Insert<'transactions'>
export type TransactionUpdate = Update<'transactions'>

export type AccountRow    = Row<'accounts'>
export type AccountInsert = Insert<'accounts'>
export type AccountUpdate = Update<'accounts'>

export type CategoryRow    = Row<'categories'>
export type CategoryInsert = Insert<'categories'>
export type CategoryUpdate = Update<'categories'>

export type BudgetRow    = Row<'budgets'>
export type BudgetInsert = Insert<'budgets'>
export type BudgetUpdate = Update<'budgets'>

export type RecurringItemRow    = Row<'recurring_items'>
export type RecurringItemInsert = Insert<'recurring_items'>
export type RecurringItemUpdate = Update<'recurring_items'>

export type SavingGoalRow    = Row<'saving_goals'>
export type SavingGoalInsert = Insert<'saving_goals'>
export type SavingGoalUpdate = Update<'saving_goals'>

export type ProfileRow    = Row<'profiles'>
export type ProfileUpdate = Update<'profiles'>

export type TagRow    = Row<'tags'>
export type TagInsert = Insert<'tags'>
export type TagUpdate = Update<'tags'>

export type GoalContributionRow    = Row<'goal_contributions'>
export type GoalContributionInsert = Insert<'goal_contributions'>
