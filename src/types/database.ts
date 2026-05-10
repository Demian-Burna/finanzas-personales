// ============================================================
// Database types — auto-generated from Supabase schema
// ============================================================
// DO NOT EDIT MANUALLY.
// Regenerate with one of:
//   npx supabase gen types typescript --project-id nydbzuyjucnoiqulrxwm > src/types/database.ts
//   (or use the Supabase MCP `generate_typescript_types` tool)
//
// Domain enums (TransactionType, BudgetPeriod, …) and the
// strongly-typed Row/Insert/Update helpers live in `./domain.ts`.
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      account_types: {
        Row: {
          icon: string | null
          id: string
          name: string
          nature: string
          sort_order: number
        }
        Insert: {
          icon?: string | null
          id?: string
          name: string
          nature: string
          sort_order?: number
        }
        Update: {
          icon?: string | null
          id?: string
          name?: string
          nature?: string
          sort_order?: number
        }
        Relationships: []
      }
      accounts: {
        Row: {
          account_type_id: string
          color: string | null
          created_at: string
          currency_code: string
          current_balance: number
          deleted_at: string | null
          description: string | null
          icon: string | null
          id: string
          include_in_net_worth: boolean
          initial_balance: number
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type_id: string
          color?: string | null
          created_at?: string
          currency_code?: string
          current_balance?: number
          deleted_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          include_in_net_worth?: boolean
          initial_balance?: number
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type_id?: string
          color?: string | null
          created_at?: string
          currency_code?: string
          current_balance?: number
          deleted_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          include_in_net_worth?: boolean
          initial_balance?: number
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'accounts_account_type_id_fkey'
            columns: ['account_type_id']
            isOneToOne: false
            referencedRelation: 'account_types'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'accounts_currency_code_fkey'
            columns: ['currency_code']
            isOneToOne: false
            referencedRelation: 'currencies'
            referencedColumns: ['code']
          },
          {
            foreignKeyName: 'accounts_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      budgets: {
        Row: {
          alert_threshold_pct: number
          amount: number
          category_id: string
          created_at: string
          currency_code: string
          deleted_at: string | null
          end_date: string | null
          id: string
          is_active: boolean
          period_type: string
          rollover_unused: boolean
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_threshold_pct?: number
          amount: number
          category_id: string
          created_at?: string
          currency_code: string
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          period_type: string
          rollover_unused?: boolean
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_threshold_pct?: number
          amount?: number
          category_id?: string
          created_at?: string
          currency_code?: string
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          period_type?: string
          rollover_unused?: boolean
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'budgets_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'budgets_currency_code_fkey'
            columns: ['currency_code']
            isOneToOne: false
            referencedRelation: 'currencies'
            referencedColumns: ['code']
          },
          {
            foreignKeyName: 'budgets_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          deleted_at: string | null
          icon: string | null
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          parent_id: string | null
          sort_order: number
          transaction_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          parent_id?: string | null
          sort_order?: number
          transaction_type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          parent_id?: string | null
          sort_order?: number
          transaction_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'categories_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'categories_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      currencies: {
        Row: {
          code: string
          decimal_places: number
          is_active: boolean
          name: string
          symbol: string
        }
        Insert: {
          code: string
          decimal_places?: number
          is_active?: boolean
          name: string
          symbol: string
        }
        Update: {
          code?: string
          decimal_places?: number
          is_active?: boolean
          name?: string
          symbol?: string
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          created_at: string
          from_currency: string
          id: string
          rate: number
          rate_date: string
          source: string | null
          to_currency: string
        }
        Insert: {
          created_at?: string
          from_currency: string
          id?: string
          rate: number
          rate_date: string
          source?: string | null
          to_currency: string
        }
        Update: {
          created_at?: string
          from_currency?: string
          id?: string
          rate?: number
          rate_date?: string
          source?: string | null
          to_currency?: string
        }
        Relationships: [
          {
            foreignKeyName: 'exchange_rates_from_currency_fkey'
            columns: ['from_currency']
            isOneToOne: false
            referencedRelation: 'currencies'
            referencedColumns: ['code']
          },
          {
            foreignKeyName: 'exchange_rates_to_currency_fkey'
            columns: ['to_currency']
            isOneToOne: false
            referencedRelation: 'currencies'
            referencedColumns: ['code']
          },
        ]
      }
      goal_contributions: {
        Row: {
          amount: number
          contribution_date: string
          created_at: string
          goal_id: string
          id: string
          note: string | null
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          contribution_date: string
          created_at?: string
          goal_id: string
          id?: string
          note?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          contribution_date?: string
          created_at?: string
          goal_id?: string
          id?: string
          note?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'goal_contributions_goal_id_fkey'
            columns: ['goal_id']
            isOneToOne: false
            referencedRelation: 'saving_goals'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'goal_contributions_transaction_id_fkey'
            columns: ['transaction_id']
            isOneToOne: false
            referencedRelation: 'transactions'
            referencedColumns: ['id']
          },
        ]
      }
      monthly_snapshots: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          net_balance: number
          net_worth: number
          snapshot_month: string
          total_expenses: number
          total_income: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          net_balance?: number
          net_worth?: number
          snapshot_month: string
          total_expenses?: number
          total_income?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          net_balance?: number
          net_worth?: number
          snapshot_month?: string
          total_expenses?: number
          total_income?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'monthly_snapshots_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      notification_preferences: {
        Row: {
          channel: string
          id: string
          is_enabled: boolean
          notification_type: string
          user_id: string
        }
        Insert: {
          channel: string
          id?: string
          is_enabled?: boolean
          notification_type: string
          user_id: string
        }
        Update: {
          channel?: string
          id?: string
          is_enabled?: boolean
          notification_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notification_preferences_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          read_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          currency_code: string
          display_name: string | null
          id: string
          locale: string
          onboarding_completed_at: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          currency_code?: string
          display_name?: string | null
          id: string
          locale?: string
          onboarding_completed_at?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          currency_code?: string
          display_name?: string | null
          id?: string
          locale?: string
          onboarding_completed_at?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_currency_code_fkey'
            columns: ['currency_code']
            isOneToOne: false
            referencedRelation: 'currencies'
            referencedColumns: ['code']
          },
        ]
      }
      recurring_items: {
        Row: {
          account_id: string
          advance_notice_days: number
          amount: number
          auto_create: boolean
          category_id: string | null
          created_at: string
          currency_code: string
          day_of_month: number | null
          day_of_week: number | null
          deleted_at: string | null
          description: string
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean
          last_executed_at: string | null
          next_occurrence_date: string | null
          notes: string | null
          start_date: string
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          advance_notice_days?: number
          amount: number
          auto_create?: boolean
          category_id?: string | null
          created_at?: string
          currency_code: string
          day_of_month?: number | null
          day_of_week?: number | null
          deleted_at?: string | null
          description: string
          end_date?: string | null
          frequency: string
          id?: string
          is_active?: boolean
          last_executed_at?: string | null
          next_occurrence_date?: string | null
          notes?: string | null
          start_date: string
          transaction_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          advance_notice_days?: number
          amount?: number
          auto_create?: boolean
          category_id?: string | null
          created_at?: string
          currency_code?: string
          day_of_month?: number | null
          day_of_week?: number | null
          deleted_at?: string | null
          description?: string
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          last_executed_at?: string | null
          next_occurrence_date?: string | null
          notes?: string | null
          start_date?: string
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'recurring_items_account_id_fkey'
            columns: ['account_id']
            isOneToOne: false
            referencedRelation: 'accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'recurring_items_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'recurring_items_currency_code_fkey'
            columns: ['currency_code']
            isOneToOne: false
            referencedRelation: 'currencies'
            referencedColumns: ['code']
          },
          {
            foreignKeyName: 'recurring_items_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      saving_goals: {
        Row: {
          account_id: string | null
          color: string | null
          created_at: string
          currency_code: string
          current_amount: number
          deleted_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          status: string
          target_amount: number
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          color?: string | null
          created_at?: string
          currency_code: string
          current_amount?: number
          deleted_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          status?: string
          target_amount: number
          target_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          color?: string | null
          created_at?: string
          currency_code?: string
          current_amount?: number
          deleted_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          status?: string
          target_amount?: number
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'saving_goals_account_id_fkey'
            columns: ['account_id']
            isOneToOne: false
            referencedRelation: 'accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'saving_goals_currency_code_fkey'
            columns: ['currency_code']
            isOneToOne: false
            referencedRelation: 'currencies'
            referencedColumns: ['code']
          },
          {
            foreignKeyName: 'saving_goals_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tags_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      transaction_tags: {
        Row: {
          tag_id: string
          transaction_id: string
        }
        Insert: {
          tag_id: string
          transaction_id: string
        }
        Update: {
          tag_id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'transaction_tags_tag_id_fkey'
            columns: ['tag_id']
            isOneToOne: false
            referencedRelation: 'tags'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transaction_tags_transaction_id_fkey'
            columns: ['transaction_id']
            isOneToOne: false
            referencedRelation: 'transactions'
            referencedColumns: ['id']
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          amount_in_base_currency: number | null
          attachment_url: string | null
          category_id: string | null
          created_at: string
          currency_code: string
          deleted_at: string | null
          description: string | null
          exchange_rate: number
          id: string
          is_reconciled: boolean
          notes: string | null
          recurring_item_id: string | null
          transaction_date: string
          transaction_type: string
          transfer_account_id: string | null
          transfer_transaction_id: string | null
          updated_at: string
          user_id: string
          value_date: string | null
        }
        Insert: {
          account_id: string
          amount: number
          amount_in_base_currency?: number | null
          attachment_url?: string | null
          category_id?: string | null
          created_at?: string
          currency_code: string
          deleted_at?: string | null
          description?: string | null
          exchange_rate?: number
          id?: string
          is_reconciled?: boolean
          notes?: string | null
          recurring_item_id?: string | null
          transaction_date: string
          transaction_type: string
          transfer_account_id?: string | null
          transfer_transaction_id?: string | null
          updated_at?: string
          user_id: string
          value_date?: string | null
        }
        Update: {
          account_id?: string
          amount?: number
          amount_in_base_currency?: number | null
          attachment_url?: string | null
          category_id?: string | null
          created_at?: string
          currency_code?: string
          deleted_at?: string | null
          description?: string | null
          exchange_rate?: number
          id?: string
          is_reconciled?: boolean
          notes?: string | null
          recurring_item_id?: string | null
          transaction_date?: string
          transaction_type?: string
          transfer_account_id?: string | null
          transfer_transaction_id?: string | null
          updated_at?: string
          user_id?: string
          value_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'transactions_account_id_fkey'
            columns: ['account_id']
            isOneToOne: false
            referencedRelation: 'accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_currency_code_fkey'
            columns: ['currency_code']
            isOneToOne: false
            referencedRelation: 'currencies'
            referencedColumns: ['code']
          },
          {
            foreignKeyName: 'transactions_recurring_item_id_fkey'
            columns: ['recurring_item_id']
            isOneToOne: false
            referencedRelation: 'recurring_items'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_transfer_account_id_fkey'
            columns: ['transfer_account_id']
            isOneToOne: false
            referencedRelation: 'accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_transfer_transaction_id_fkey'
            columns: ['transfer_transaction_id']
            isOneToOne: false
            referencedRelation: 'transactions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      budgets_with_progress: {
        Args: { p_reference_date?: string }
        Returns: {
          alert_threshold_pct: number
          amount: number
          category_color: string
          category_icon: string
          category_id: string
          category_name: string
          created_at: string
          currency_code: string
          days_elapsed: number
          days_in_period: number
          end_date: string
          id: string
          is_active: boolean
          period_end: string
          period_start: string
          period_type: string
          projected_total: number
          rollover_unused: boolean
          spent_amount: number
          start_date: string
          updated_at: string
          user_id: string
        }[]
      }
      dashboard_stats: { Args: { p_reference_date?: string }; Returns: Json }
      monthly_flow: {
        Args: { p_months?: number }
        Returns: {
          expenses: number
          income: number
          month_start: string
          net: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
