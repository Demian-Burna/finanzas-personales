// ============================================================
// Database types — generated from Supabase schema
// Regenerate with: npx supabase gen types typescript --local > src/types/database.ts
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          currency_code: string
          locale: string
          timezone: string
          onboarding_completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Tables<'profiles'>['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Tables<'profiles'>['Insert']>
      }
      currencies: {
        Row: {
          code: string
          name: string
          symbol: string
          decimal_places: number
          is_active: boolean
        }
        Insert: Tables<'currencies'>['Row']
        Update: Partial<Tables<'currencies'>['Insert']>
      }
      account_types: {
        Row: {
          id: string
          name: string
          nature: 'asset' | 'liability'
          icon: string | null
          sort_order: number
        }
        Insert: Omit<Tables<'account_types'>['Row'], 'id'>
        Update: Partial<Tables<'account_types'>['Insert']>
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          account_type_id: string
          currency_code: string
          name: string
          description: string | null
          initial_balance: number
          current_balance: number
          color: string | null
          icon: string | null
          is_active: boolean
          include_in_net_worth: boolean
          sort_order: number
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Tables<'accounts'>['Row'], 'id' | 'current_balance' | 'created_at' | 'updated_at'>
        Update: Partial<Tables<'accounts'>['Insert']>
      }
      categories: {
        Row: {
          id: string
          user_id: string | null
          parent_id: string | null
          name: string
          color: string | null
          icon: string | null
          transaction_type: TransactionType
          is_system: boolean
          is_active: boolean
          sort_order: number
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Tables<'categories'>['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Tables<'categories'>['Insert']>
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Tables<'tags'>['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Tables<'tags'>['Insert']>
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string
          category_id: string | null
          transfer_account_id: string | null
          transfer_transaction_id: string | null
          currency_code: string
          amount: number
          amount_in_base_currency: number | null
          exchange_rate: number
          transaction_type: TransactionType
          description: string | null
          notes: string | null
          transaction_date: string
          value_date: string | null
          is_reconciled: boolean
          recurring_item_id: string | null
          attachment_url: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Tables<'transactions'>['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Tables<'transactions'>['Insert']>
      }
      transaction_tags: {
        Row: {
          transaction_id: string
          tag_id: string
        }
        Insert: Tables<'transaction_tags'>['Row']
        Update: Partial<Tables<'transaction_tags'>['Insert']>
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category_id: string
          period_type: BudgetPeriod
          amount: number
          currency_code: string
          start_date: string
          end_date: string | null
          rollover_unused: boolean
          alert_threshold_pct: number
          is_active: boolean
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Tables<'budgets'>['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Tables<'budgets'>['Insert']>
      }
      recurring_items: {
        Row: {
          id: string
          user_id: string
          account_id: string
          category_id: string | null
          currency_code: string
          amount: number
          transaction_type: TransactionType
          description: string
          notes: string | null
          frequency: RecurringFrequency
          day_of_month: number | null
          day_of_week: number | null
          start_date: string
          end_date: string | null
          next_occurrence_date: string | null
          last_executed_at: string | null
          is_active: boolean
          auto_create: boolean
          advance_notice_days: number
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Tables<'recurring_items'>['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Tables<'recurring_items'>['Insert']>
      }
      saving_goals: {
        Row: {
          id: string
          user_id: string
          account_id: string | null
          currency_code: string
          name: string
          description: string | null
          target_amount: number
          current_amount: number
          target_date: string | null
          color: string | null
          icon: string | null
          status: GoalStatus
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Tables<'saving_goals'>['Row'], 'id' | 'current_amount' | 'created_at' | 'updated_at'>
        Update: Partial<Tables<'saving_goals'>['Insert']>
      }
      goal_contributions: {
        Row: {
          id: string
          goal_id: string
          transaction_id: string | null
          amount: number
          note: string | null
          contribution_date: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Tables<'goal_contributions'>['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Tables<'goal_contributions'>['Insert']>
      }
      exchange_rates: {
        Row: {
          id: string
          from_currency: string
          to_currency: string
          rate: number
          rate_date: string
          source: string | null
          created_at: string
        }
        Insert: Omit<Tables<'exchange_rates'>['Row'], 'id' | 'created_at'>
        Update: Partial<Tables<'exchange_rates'>['Insert']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: NotificationType
          title: string
          message: string | null
          related_entity_type: string | null
          related_entity_id: string | null
          is_read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: Omit<Tables<'notifications'>['Row'], 'id' | 'created_at'>
        Update: Pick<Tables<'notifications'>['Row'], 'is_read' | 'read_at'>
      }
      notification_preferences: {
        Row: {
          id: string
          user_id: string
          notification_type: NotificationType
          channel: NotificationChannel
          is_enabled: boolean
        }
        Insert: Omit<Tables<'notification_preferences'>['Row'], 'id'>
        Update: Partial<Tables<'notification_preferences'>['Insert']>
      }
      monthly_snapshots: {
        Row: {
          id: string
          user_id: string
          snapshot_month: string
          total_income: number
          total_expenses: number
          net_balance: number
          net_worth: number
          data: MonthlySnapshotData | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Tables<'monthly_snapshots'>['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Tables<'monthly_snapshots'>['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// ── Domain enums ─────────────────────────────────────────────
export type TransactionType   = 'income' | 'expense' | 'transfer'
export type BudgetPeriod      = 'monthly' | 'weekly' | 'yearly' | 'custom'
export type RecurringFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'bimonthly' | 'quarterly' | 'yearly'
export type GoalStatus        = 'active' | 'completed' | 'paused' | 'cancelled'
export type AccountNature     = 'asset' | 'liability'
export type NotificationType  =
  | 'budget_alert'
  | 'recurring_reminder'
  | 'goal_milestone'
  | 'goal_completed'
  | 'low_balance'
  | 'monthly_summary'
export type NotificationChannel = 'in_app' | 'email'

// ── JSONB shapes ──────────────────────────────────────────────
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

// ── Convenience type helpers ──────────────────────────────────
type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]

export type Row<T extends keyof Database['public']['Tables']> =
  Tables<T>['Row']

export type Insert<T extends keyof Database['public']['Tables']> =
  Tables<T>['Insert']

export type Update<T extends keyof Database['public']['Tables']> =
  Tables<T>['Update']
