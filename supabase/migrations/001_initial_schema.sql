-- ============================================================
-- MIGRATION 001: Initial Schema
-- Project: Finanzas Personales
-- PostgreSQL 15 / Supabase
-- ============================================================
-- Design principles:
--   • Amounts are ALWAYS stored as positive numerics.
--     Sign is derived from transaction_type + account perspective.
--   • current_balance on accounts is denormalized for O(1) reads
--     and kept in sync by update_account_balance() trigger.
--   • Soft delete (deleted_at) on tables that need audit trails.
--     Hard-delete is reserved for tags and non-critical join tables.
--   • System categories have user_id IS NULL and are read-only
--     for all users.  UNIQUE NULLS NOT DISTINCT (pg 15+) lets
--     multiple system categories share parent_id NULL without
--     colliding with user categories.
--   • Transfers create ONE canonical transaction record.
--     The balance trigger processes both sides.  Mirror records
--     (transfer_transaction_id IS NOT NULL) are skipped to avoid
--     double-counting.
-- ============================================================


-- ┌─────────────────────────────────────────────────────────┐
-- │ 0. EXTENSIONS                                           │
-- └─────────────────────────────────────────────────────────┘

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ┌─────────────────────────────────────────────────────────┐
-- │ 1. SHARED TRIGGER FUNCTION                              │
-- └─────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION set_updated_at IS
  'Generic BEFORE UPDATE trigger that stamps updated_at = NOW(). Attach to every table that has an updated_at column.';


-- ┌─────────────────────────────────────────────────────────┐
-- │ 2. CATALOGUE TABLES  (no user dependency)               │
-- └─────────────────────────────────────────────────────────┘

-- ----------------------------------------------------------
-- 2.1  CURRENCIES
-- ----------------------------------------------------------
CREATE TABLE currencies (
  code           char(3)   PRIMARY KEY,          -- ISO 4217 (e.g. ARS, USD, EUR)
  name           text      NOT NULL,
  symbol         varchar(5) NOT NULL,
  decimal_places smallint  NOT NULL DEFAULT 2
                           CHECK (decimal_places >= 0),
  is_active      boolean   NOT NULL DEFAULT true
);

COMMENT ON TABLE  currencies            IS 'ISO 4217 currency catalogue.  Managed via migrations.';
COMMENT ON COLUMN currencies.code       IS 'ISO 4217 three-letter code used as PK and FK throughout the schema.';
COMMENT ON COLUMN currencies.decimal_places IS 'Number of minor units (e.g. 2 for ARS/USD, 0 for JPY).';

-- ----------------------------------------------------------
-- 2.2  ACCOUNT TYPES
-- ----------------------------------------------------------
CREATE TABLE account_types (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       varchar(50) NOT NULL UNIQUE,
  -- "asset" accounts add to net worth; "liability" accounts reduce it.
  nature     varchar(10) NOT NULL CHECK (nature IN ('asset', 'liability')),
  icon       varchar(50),
  sort_order smallint    NOT NULL DEFAULT 0
);

COMMENT ON TABLE  account_types        IS 'Catalogue of financial account kinds. Determines net-worth sign.';
COMMENT ON COLUMN account_types.nature IS '"asset" | "liability" — affects how current_balance is summed into net worth.';


-- ┌─────────────────────────────────────────────────────────┐
-- │ 3. USER-SCOPED TABLES (dependency order)                │
-- └─────────────────────────────────────────────────────────┘

-- ----------------------------------------------------------
-- 3.1  PROFILES  (1:1 extension of auth.users)
-- ----------------------------------------------------------
CREATE TABLE profiles (
  id                      uuid        PRIMARY KEY
                                      REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name            text,
  avatar_url              text,
  -- Default to ARS; changed during onboarding.  FK enforces valid ISO code.
  currency_code           char(3)     NOT NULL DEFAULT 'ARS'
                                      REFERENCES currencies(code) ON UPDATE CASCADE,
  locale                  varchar(10) NOT NULL DEFAULT 'es-AR',
  timezone                varchar(50) NOT NULL
                                      DEFAULT 'America/Argentina/Buenos_Aires',
  onboarding_completed_at timestamptz,
  created_at              timestamptz NOT NULL DEFAULT NOW(),
  updated_at              timestamptz NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  profiles IS '1:1 extension of auth.users created automatically by handle_new_user() trigger.';
COMMENT ON COLUMN profiles.currency_code IS 'User''s base currency. Used for cross-currency amount_in_base_currency calculations.';

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-provision a profile row whenever a new Supabase Auth user is created.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER           -- runs with definer privileges to bypass RLS on insert
SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;  -- idempotent in case of retries
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ----------------------------------------------------------
-- 3.2  CATEGORIES  (self-referencing, max 2 levels)
-- ----------------------------------------------------------
CREATE TABLE categories (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- NULL  = system category visible to all users (read-only for end users)
  -- uuid  = user-private category
  user_id          uuid        REFERENCES profiles(id) ON DELETE CASCADE,
  -- NULL  = root (level 1); non-null = subcategory (level 2)
  -- The app enforces max depth of 2; the DB allows arbitrary depth for flexibility.
  parent_id        uuid        REFERENCES categories(id) ON DELETE SET NULL,
  name             text        NOT NULL,
  color            varchar(7),         -- #RRGGBB hex
  icon             varchar(50),        -- icon name / lucide key
  transaction_type varchar(10) NOT NULL
                               CHECK (transaction_type IN ('income', 'expense', 'transfer')),
  is_system        boolean     NOT NULL DEFAULT false,
  is_active        boolean     NOT NULL DEFAULT true,
  sort_order       smallint    NOT NULL DEFAULT 0,
  deleted_at       timestamptz,
  created_at       timestamptz NOT NULL DEFAULT NOW(),
  updated_at       timestamptz NOT NULL DEFAULT NOW(),
  -- Prevents duplicate category names per user+parent combination.
  -- NULLS NOT DISTINCT (pg 15+) means two system categories (user_id IS NULL)
  -- with the same parent can NOT share a name — which is the desired behaviour.
  CONSTRAINT uq_categories_user_parent_name
    UNIQUE NULLS NOT DISTINCT (user_id, parent_id, name)
);

COMMENT ON TABLE  categories IS 'Two-level category tree. user_id IS NULL marks system categories. Depth is enforced by application.';
COMMENT ON COLUMN categories.user_id  IS 'NULL = system category available to all; non-null = belongs to one user.';
COMMENT ON COLUMN categories.parent_id IS 'NULL for root (level-1) categories.  Non-null for subcategories.';
COMMENT ON COLUMN categories.is_system IS 'True for seed categories that should not be deleted or reassigned by users.';

CREATE TRIGGER set_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_categories_user_id        ON categories(user_id);
CREATE INDEX idx_categories_parent_id      ON categories(parent_id);
CREATE INDEX idx_categories_type           ON categories(transaction_type);
CREATE INDEX idx_categories_active         ON categories(user_id, is_active)
  WHERE deleted_at IS NULL;

-- ----------------------------------------------------------
-- 3.3  ACCOUNTS
-- ----------------------------------------------------------
CREATE TABLE accounts (
  id                   uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid           NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_type_id      uuid           NOT NULL REFERENCES account_types(id),
  currency_code        char(3)        NOT NULL DEFAULT 'ARS'
                                      REFERENCES currencies(code) ON UPDATE CASCADE,
  name                 text           NOT NULL,
  description          text,
  initial_balance      numeric(15,2)  NOT NULL DEFAULT 0,
  -- Denormalized for O(1) reads.  Maintained by update_account_balance() trigger.
  -- Formula: initial_balance + SUM(signed transaction amounts)
  current_balance      numeric(15,2)  NOT NULL DEFAULT 0,
  color                varchar(7),
  icon                 varchar(50),
  is_active            boolean        NOT NULL DEFAULT true,
  include_in_net_worth boolean        NOT NULL DEFAULT true,
  sort_order           smallint       NOT NULL DEFAULT 0,
  deleted_at           timestamptz,
  created_at           timestamptz    NOT NULL DEFAULT NOW(),
  updated_at           timestamptz    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  accounts IS 'User financial accounts (bank, cash, credit card, etc.).';
COMMENT ON COLUMN accounts.current_balance IS
  'Denormalized running balance. = initial_balance + Σ(income) − Σ(expense) − Σ(transfer-out) + Σ(transfer-in). '
  'Kept in sync by update_account_balance() trigger.';
COMMENT ON COLUMN accounts.include_in_net_worth IS
  'False for off-balance-sheet accounts (e.g. a savings account tracked separately).';

CREATE TRIGGER set_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_accounts_user_id      ON accounts(user_id);
CREATE INDEX idx_accounts_type_id      ON accounts(account_type_id);
CREATE INDEX idx_accounts_user_active  ON accounts(user_id, is_active)
  WHERE deleted_at IS NULL;

-- ----------------------------------------------------------
-- 3.4  TAGS
-- ----------------------------------------------------------
CREATE TABLE tags (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name       varchar(50) NOT NULL,
  color      varchar(7),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_tags_user_name UNIQUE (user_id, name)
);

CREATE TRIGGER set_tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_tags_user_id ON tags(user_id);

-- ----------------------------------------------------------
-- 3.5  RECURRING ITEMS  (must precede transactions due to FK)
-- ----------------------------------------------------------
CREATE TABLE recurring_items (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id          uuid          NOT NULL REFERENCES accounts(id),
  category_id         uuid          REFERENCES categories(id) ON DELETE SET NULL,
  currency_code       char(3)       NOT NULL REFERENCES currencies(code) ON UPDATE CASCADE,
  amount              numeric(15,2) NOT NULL CHECK (amount > 0),
  transaction_type    varchar(10)   NOT NULL
                                    CHECK (transaction_type IN ('income', 'expense', 'transfer')),
  description         text          NOT NULL,
  notes               text,
  frequency           varchar(20)   NOT NULL
                                    CHECK (frequency IN (
                                      'daily', 'weekly', 'biweekly',
                                      'monthly', 'bimonthly', 'quarterly', 'yearly'
                                    )),
  -- day_of_month is used for monthly/bimonthly/quarterly/yearly frequencies.
  -- Values 29-31 are clamped to the last day of the month when applicable.
  day_of_month        smallint      CHECK (day_of_month BETWEEN 1 AND 31),
  -- day_of_week: 0=Sunday … 6=Saturday. Used for weekly/biweekly.
  day_of_week         smallint      CHECK (day_of_week BETWEEN 0 AND 6),
  start_date          date          NOT NULL,
  end_date            date,
  next_occurrence_date date,
  last_executed_at    timestamptz,
  is_active           boolean       NOT NULL DEFAULT true,
  -- auto_create=true: a scheduled edge function inserts the transaction automatically.
  -- auto_create=false: only an in-app reminder notification is sent.
  auto_create         boolean       NOT NULL DEFAULT false,
  advance_notice_days smallint      NOT NULL DEFAULT 3
                                    CHECK (advance_notice_days >= 0),
  deleted_at          timestamptz,
  created_at          timestamptz   NOT NULL DEFAULT NOW(),
  updated_at          timestamptz   NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_recurring_end_after_start
    CHECK (end_date IS NULL OR end_date >= start_date)
);

COMMENT ON TABLE  recurring_items IS 'Templates for predictable periodic transactions (rent, salary, subscriptions).';
COMMENT ON COLUMN recurring_items.auto_create IS
  'If true, an Edge Function / cron job creates the transaction automatically on next_occurrence_date. '
  'If false, only a reminder notification is dispatched.';
COMMENT ON COLUMN recurring_items.day_of_month IS
  'For monthly+ frequencies: target day. Clamped to last day of month for short months.';
COMMENT ON COLUMN recurring_items.day_of_week  IS
  '0=Sunday … 6=Saturday. Applicable to weekly and biweekly frequencies.';

CREATE TRIGGER set_recurring_items_updated_at
  BEFORE UPDATE ON recurring_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_recurring_user_id         ON recurring_items(user_id);
CREATE INDEX idx_recurring_account_id      ON recurring_items(account_id);
CREATE INDEX idx_recurring_next_occurrence ON recurring_items(user_id, next_occurrence_date)
  WHERE is_active = true AND deleted_at IS NULL;

-- ----------------------------------------------------------
-- 3.6  TRANSACTIONS  (core financial event log)
-- ----------------------------------------------------------
CREATE TABLE transactions (
  id                      uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id              uuid          NOT NULL REFERENCES accounts(id),
  category_id             uuid          REFERENCES categories(id) ON DELETE SET NULL,
  -- For transfers: destination account.  NULL for income/expense.
  transfer_account_id     uuid          REFERENCES accounts(id),
  -- Links the two sides of a transfer.  NULL = source-side (canonical).
  -- Non-null = destination-side mirror (balance trigger skips it).
  transfer_transaction_id uuid          REFERENCES transactions(id) ON DELETE SET NULL,
  currency_code           char(3)       NOT NULL
                                        REFERENCES currencies(code) ON UPDATE CASCADE,
  -- amount is ALWAYS positive.  Sign is determined by transaction_type.
  amount                  numeric(15,2) NOT NULL CHECK (amount > 0),
  -- Populated only when currency_code ≠ the user's base currency.
  amount_in_base_currency numeric(15,2),
  exchange_rate           numeric(15,6) NOT NULL DEFAULT 1
                                        CHECK (exchange_rate > 0),
  transaction_type        varchar(10)   NOT NULL
                                        CHECK (transaction_type IN ('income', 'expense', 'transfer')),
  description             text,
  notes                   text,
  transaction_date        date          NOT NULL,
  -- The date the amount actually settled; useful for credit card statements.
  value_date              date,
  is_reconciled           boolean       NOT NULL DEFAULT false,
  recurring_item_id       uuid          REFERENCES recurring_items(id) ON DELETE SET NULL,
  attachment_url          text,
  deleted_at              timestamptz,
  created_at              timestamptz   NOT NULL DEFAULT NOW(),
  updated_at              timestamptz   NOT NULL DEFAULT NOW(),
  -- Transfers must always name their destination account.
  CONSTRAINT chk_transfer_needs_dest_account
    CHECK (transaction_type != 'transfer' OR transfer_account_id IS NOT NULL),
  -- A self-transfer is a data error.
  CONSTRAINT chk_no_self_transfer
    CHECK (transfer_account_id IS NULL OR transfer_account_id != account_id)
);

COMMENT ON TABLE  transactions IS
  'Core ledger. amount is always positive; sign is implied by transaction_type. '
  'Transfers use a source record (transfer_transaction_id IS NULL) plus an optional '
  'mirror record (transfer_transaction_id IS NOT NULL). The balance trigger only '
  'processes the source record.';
COMMENT ON COLUMN transactions.amount IS
  'Always positive. Effect on account_id: income=+, expense=−, transfer=− (source). '
  'Effect on transfer_account_id: transfer=+ (destination).';
COMMENT ON COLUMN transactions.amount_in_base_currency IS
  'amount × exchange_rate, stored when currency differs from user base currency.';
COMMENT ON COLUMN transactions.transfer_transaction_id IS
  'Points to the destination-side mirror transaction. NULL on the source record. '
  'The balance trigger skips mirror records to prevent double-counting.';
COMMENT ON COLUMN transactions.value_date IS
  'The date the transaction cleared the account (credit card billing cycle, bank settlement).';

CREATE TRIGGER set_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- User timeline (primary query pattern)
CREATE INDEX idx_txn_user_date          ON transactions(user_id, transaction_date DESC)
  WHERE deleted_at IS NULL;
-- Account ledger
CREATE INDEX idx_txn_account_date       ON transactions(account_id, transaction_date DESC)
  WHERE deleted_at IS NULL;
-- Budget / category reporting
CREATE INDEX idx_txn_user_cat_date      ON transactions(user_id, category_id, transaction_date)
  WHERE deleted_at IS NULL;
-- Recurring linkage
CREATE INDEX idx_txn_recurring_id       ON transactions(recurring_item_id)
  WHERE deleted_at IS NULL;
-- Transfer pairing
CREATE INDEX idx_txn_transfer_txn_id    ON transactions(transfer_transaction_id);
-- Unreconciled items
CREATE INDEX idx_txn_unreconciled       ON transactions(user_id, is_reconciled)
  WHERE deleted_at IS NULL AND is_reconciled = false;

-- ----------------------------------------------------------
-- 3.7  TRANSACTION TAGS  (pivot)
-- ----------------------------------------------------------
CREATE TABLE transaction_tags (
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  tag_id         uuid NOT NULL REFERENCES tags(id)         ON DELETE CASCADE,
  PRIMARY KEY (transaction_id, tag_id)
);

COMMENT ON TABLE transaction_tags IS 'M:N pivot between transactions and tags. No extra columns needed (BCNF).';

CREATE INDEX idx_txn_tags_tag_id ON transaction_tags(tag_id);

-- ----------------------------------------------------------
-- 3.8  BUDGETS
-- ----------------------------------------------------------
CREATE TABLE budgets (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id         uuid          NOT NULL REFERENCES categories(id),
  period_type         varchar(10)   NOT NULL
                                    CHECK (period_type IN ('monthly', 'weekly', 'yearly', 'custom')),
  amount              numeric(15,2) NOT NULL CHECK (amount > 0),
  currency_code       char(3)       NOT NULL REFERENCES currencies(code) ON UPDATE CASCADE,
  start_date          date          NOT NULL,
  -- NULL = open-ended (budget repeats indefinitely per period_type)
  end_date            date,
  -- If true, unspent budget in one period adds to the next period's limit.
  rollover_unused     boolean       NOT NULL DEFAULT false,
  -- Send a budget_alert notification when spending reaches this % of amount.
  alert_threshold_pct smallint      NOT NULL DEFAULT 80
                                    CHECK (alert_threshold_pct BETWEEN 1 AND 100),
  is_active           boolean       NOT NULL DEFAULT true,
  deleted_at          timestamptz,
  created_at          timestamptz   NOT NULL DEFAULT NOW(),
  updated_at          timestamptz   NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_budget_end_after_start
    CHECK (end_date IS NULL OR end_date >= start_date)
);

COMMENT ON COLUMN budgets.rollover_unused IS
  'If true, Σ(unspent amount) from previous period is added to current period limit.';
COMMENT ON COLUMN budgets.alert_threshold_pct IS
  'Triggers a budget_alert notification when spending / amount >= this value / 100.';

CREATE TRIGGER set_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_budgets_user_active  ON budgets(user_id, is_active)  WHERE deleted_at IS NULL;
CREATE INDEX idx_budgets_category_id  ON budgets(category_id);
CREATE INDEX idx_budgets_user_date    ON budgets(user_id, start_date, end_date);

-- ----------------------------------------------------------
-- 3.9  SAVING GOALS
-- ----------------------------------------------------------
CREATE TABLE saving_goals (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Optional: link to the account where savings are held.
  account_id     uuid          REFERENCES accounts(id) ON DELETE SET NULL,
  currency_code  char(3)       NOT NULL REFERENCES currencies(code) ON UPDATE CASCADE,
  name           text          NOT NULL,
  description    text,
  target_amount  numeric(15,2) NOT NULL CHECK (target_amount > 0),
  -- Denormalized sum of goal_contributions.amount; kept in sync by sync_goal_current_amount().
  current_amount numeric(15,2) NOT NULL DEFAULT 0
                               CHECK (current_amount >= 0),
  target_date    date,
  color          varchar(7),
  icon           varchar(50),
  status         varchar(20)   NOT NULL DEFAULT 'active'
                               CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  deleted_at     timestamptz,
  created_at     timestamptz   NOT NULL DEFAULT NOW(),
  updated_at     timestamptz   NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN saving_goals.current_amount IS
  'Denormalized total of goal_contributions.amount. Maintained by sync_goal_current_amount() trigger.';

CREATE TRIGGER set_saving_goals_updated_at
  BEFORE UPDATE ON saving_goals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_goals_user_id    ON saving_goals(user_id)    WHERE deleted_at IS NULL;
CREATE INDEX idx_goals_account_id ON saving_goals(account_id);

-- ----------------------------------------------------------
-- 3.10  GOAL CONTRIBUTIONS
-- ----------------------------------------------------------
CREATE TABLE goal_contributions (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id           uuid          NOT NULL REFERENCES saving_goals(id) ON DELETE CASCADE,
  -- Optionally linked to a real transaction (e.g. a transfer to the savings account).
  transaction_id    uuid          REFERENCES transactions(id) ON DELETE SET NULL,
  amount            numeric(15,2) NOT NULL CHECK (amount > 0),
  note              text,
  contribution_date date          NOT NULL,
  created_at        timestamptz   NOT NULL DEFAULT NOW(),
  updated_at        timestamptz   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_goal_contributions_updated_at
  BEFORE UPDATE ON goal_contributions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_goal_contrib_goal_id        ON goal_contributions(goal_id);
CREATE INDEX idx_goal_contrib_transaction_id ON goal_contributions(transaction_id);

-- Sync saving_goals.current_amount after any change in goal_contributions.
CREATE OR REPLACE FUNCTION sync_goal_current_amount()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
  v_goal_id uuid := COALESCE(NEW.goal_id, OLD.goal_id);
BEGIN
  UPDATE saving_goals
  SET    current_amount = COALESCE(
           (SELECT SUM(amount) FROM goal_contributions WHERE goal_id = v_goal_id),
           0
         )
  WHERE  id = v_goal_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_sync_goal_amount
  AFTER INSERT OR UPDATE OR DELETE ON goal_contributions
  FOR EACH ROW EXECUTE FUNCTION sync_goal_current_amount();

-- ----------------------------------------------------------
-- 3.11  EXCHANGE RATES  (historical FX)
-- ----------------------------------------------------------
CREATE TABLE exchange_rates (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency char(3)       NOT NULL REFERENCES currencies(code) ON UPDATE CASCADE,
  to_currency   char(3)       NOT NULL REFERENCES currencies(code) ON UPDATE CASCADE,
  rate          numeric(15,6) NOT NULL CHECK (rate > 0),
  rate_date     date          NOT NULL,
  -- "manual" for user-entered rates; provider name for API-sourced rates.
  source        varchar(50),
  created_at    timestamptz   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_exchange_rate_pair_date
    UNIQUE (from_currency, to_currency, rate_date),
  -- Rate of a currency against itself is always 1 and doesn't need storage.
  CONSTRAINT chk_no_self_rate
    CHECK (from_currency != to_currency)
);

COMMENT ON TABLE  exchange_rates IS
  'Historical FX rates. rate = units of to_currency per 1 unit of from_currency.';
COMMENT ON COLUMN exchange_rates.source IS
  '"manual" for user-entered; provider identifier (e.g. "bcra", "fixer.io") for API-sourced.';

CREATE INDEX idx_fx_pair_date ON exchange_rates(from_currency, to_currency, rate_date DESC);

-- ----------------------------------------------------------
-- 3.12  NOTIFICATIONS
-- ----------------------------------------------------------
CREATE TABLE notifications (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Typed enum-like: budget_alert | recurring_reminder | goal_milestone |
  --                  goal_completed | low_balance | monthly_summary
  type                varchar(50) NOT NULL,
  title               text        NOT NULL,
  message             text,
  -- Allows the frontend to deep-link to the related entity.
  related_entity_type varchar(50),   -- 'budget' | 'recurring_item' | 'goal' | 'transaction'
  related_entity_id   uuid,
  is_read             boolean     NOT NULL DEFAULT false,
  read_at             timestamptz,
  created_at          timestamptz NOT NULL DEFAULT NOW()
  -- No updated_at: notifications are append-only; only is_read / read_at change.
);

COMMENT ON COLUMN notifications.related_entity_type IS
  'Discriminator for related_entity_id deep-links: budget | recurring_item | goal | transaction.';

CREATE INDEX idx_notif_user_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notif_user_all    ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notif_entity      ON notifications(related_entity_type, related_entity_id);

-- ----------------------------------------------------------
-- 3.13  NOTIFICATION PREFERENCES
-- ----------------------------------------------------------
CREATE TABLE notification_preferences (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type varchar(50) NOT NULL,
  channel           varchar(20) NOT NULL CHECK (channel IN ('in_app', 'email')),
  is_enabled        boolean     NOT NULL DEFAULT true,
  CONSTRAINT uq_notification_prefs UNIQUE (user_id, notification_type, channel)
);

CREATE INDEX idx_notif_prefs_user_id ON notification_preferences(user_id);

-- ----------------------------------------------------------
-- 3.14  MONTHLY SNAPSHOTS  (pre-computed report cache)
-- ----------------------------------------------------------
CREATE TABLE monthly_snapshots (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Always first day of month (enforced by constraint below).
  snapshot_month date          NOT NULL,
  total_income   numeric(15,2) NOT NULL DEFAULT 0,
  total_expenses numeric(15,2) NOT NULL DEFAULT 0,
  net_balance    numeric(15,2) NOT NULL DEFAULT 0,  -- income - expenses
  net_worth      numeric(15,2) NOT NULL DEFAULT 0,  -- Σ(asset accounts) - Σ(liability accounts)
  -- JSON structure:
  -- {
  --   "categories": [{"id":"…","name":"…","income":0,"expenses":0}],
  --   "accounts":   [{"id":"…","name":"…","balance":0,"type":"asset|liability"}],
  --   "topExpenses":[{"category_id":"…","name":"…","amount":0,"pct":0}]
  -- }
  data           jsonb,
  created_at     timestamptz   NOT NULL DEFAULT NOW(),
  updated_at     timestamptz   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_snapshot_user_month UNIQUE (user_id, snapshot_month),
  -- Guard: snapshot_month must be the 1st day of a month.
  CONSTRAINT chk_snapshot_first_of_month
    CHECK (EXTRACT(DAY FROM snapshot_month) = 1)
);

COMMENT ON COLUMN monthly_snapshots.snapshot_month IS
  'Always first day of month (e.g. ''2024-01-01'' for January 2024). Enforced by constraint.';
COMMENT ON COLUMN monthly_snapshots.data IS
  'JSONB cache of the full breakdown: categories, accounts, topExpenses. Regenerated by a scheduled function.';

CREATE TRIGGER set_monthly_snapshots_updated_at
  BEFORE UPDATE ON monthly_snapshots
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_snapshots_user_month ON monthly_snapshots(user_id, snapshot_month DESC);


-- ┌─────────────────────────────────────────────────────────┐
-- │ 4. ACCOUNT BALANCE MAINTENANCE TRIGGER                  │
-- └─────────────────────────────────────────────────────────┘
-- Strategy:
--   • amount is always positive in the DB.
--   • income   → account_id balance += amount
--   • expense  → account_id balance -= amount
--   • transfer (transfer_transaction_id IS NULL = source record):
--       account_id          -= amount   (debit source)
--       transfer_account_id += amount   (credit destination)
--   • transfer (transfer_transaction_id IS NOT NULL = mirror record):
--       skipped — balance already handled by the source record above.
--
--   On UPDATE:  revert OLD state first, then apply NEW state.
--   On soft-delete (deleted_at set to non-null): revert only (NEW.deleted_at IS NOT NULL).
--   On restore  (deleted_at set to null): apply only  (OLD.deleted_at IS NOT NULL).
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN

  -- ── Step 1: REVERT the OLD transaction (UPDATE and DELETE) ──────────────
  IF TG_OP IN ('UPDATE', 'DELETE') AND OLD.deleted_at IS NULL THEN
    CASE OLD.transaction_type
      WHEN 'income' THEN
        UPDATE accounts SET current_balance = current_balance - OLD.amount
        WHERE id = OLD.account_id;

      WHEN 'expense' THEN
        UPDATE accounts SET current_balance = current_balance + OLD.amount
        WHERE id = OLD.account_id;

      WHEN 'transfer' THEN
        -- Only revert the source-side record; skip mirrors.
        IF OLD.transfer_transaction_id IS NULL THEN
          UPDATE accounts SET current_balance = current_balance + OLD.amount
          WHERE id = OLD.account_id;         -- undo debit on source
          UPDATE accounts SET current_balance = current_balance - OLD.amount
          WHERE id = OLD.transfer_account_id; -- undo credit on destination
        END IF;
    END CASE;
  END IF;

  -- ── Step 2: APPLY the NEW transaction (INSERT and UPDATE) ───────────────
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.deleted_at IS NULL THEN
    CASE NEW.transaction_type
      WHEN 'income' THEN
        UPDATE accounts SET current_balance = current_balance + NEW.amount
        WHERE id = NEW.account_id;

      WHEN 'expense' THEN
        UPDATE accounts SET current_balance = current_balance - NEW.amount
        WHERE id = NEW.account_id;

      WHEN 'transfer' THEN
        -- Only process the source-side record.
        IF NEW.transfer_transaction_id IS NULL THEN
          UPDATE accounts SET current_balance = current_balance - NEW.amount
          WHERE id = NEW.account_id;          -- debit source
          UPDATE accounts SET current_balance = current_balance + NEW.amount
          WHERE id = NEW.transfer_account_id; -- credit destination
        END IF;
    END CASE;
  END IF;

  -- For AFTER triggers the return value is ignored, but we return the
  -- correct row so the trigger is compatible if converted to BEFORE later.
  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION update_account_balance IS
  'Maintains accounts.current_balance after any INSERT/UPDATE/DELETE on transactions. '
  'Handles income (+), expense (−), and transfers (−source, +destination). '
  'Mirror transfer records (transfer_transaction_id IS NOT NULL) are skipped.';

CREATE TRIGGER trg_update_account_balance
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_account_balance();


-- ┌─────────────────────────────────────────────────────────┐
-- │ 5. ROW LEVEL SECURITY                                   │
-- └─────────────────────────────────────────────────────────┘
-- Catalogue tables (currencies, account_types, exchange_rates):
--   Public SELECT, no direct user writes (managed by migrations/edge functions).
-- User-scoped tables:
--   All operations restricted to auth.uid() = user_id.
-- categories:
--   SELECT allows system rows (user_id IS NULL).
--   INSERT/UPDATE/DELETE restricted to the user's own non-system rows.
-- pivot tables (transaction_tags, goal_contributions):
--   Access verified via the parent table's user_id.
-- ────────────────────────────────────────────────────────────

ALTER TABLE currencies               ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_types            ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates           ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories               ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_tags         ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE saving_goals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_contributions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications            ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_snapshots        ENABLE ROW LEVEL SECURITY;

-- ── Catalogues: public read ──────────────────────────────────────────────
CREATE POLICY currencies_select_all     ON currencies     FOR SELECT USING (true);
CREATE POLICY account_types_select_all  ON account_types  FOR SELECT USING (true);
CREATE POLICY exchange_rates_select_all ON exchange_rates  FOR SELECT USING (true);

-- ── profiles ─────────────────────────────────────────────────────────────
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ── categories: own rows + system rows ───────────────────────────────────
CREATE POLICY categories_select ON categories
  FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY categories_insert_own ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_system = false);
CREATE POLICY categories_update_own ON categories
  FOR UPDATE USING (auth.uid() = user_id AND is_system = false);
CREATE POLICY categories_delete_own ON categories
  FOR DELETE USING (auth.uid() = user_id AND is_system = false);

-- ── accounts ─────────────────────────────────────────────────────────────
CREATE POLICY accounts_select ON accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY accounts_insert ON accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY accounts_update ON accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY accounts_delete ON accounts FOR DELETE USING (auth.uid() = user_id);

-- ── tags ─────────────────────────────────────────────────────────────────
CREATE POLICY tags_select ON tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY tags_insert ON tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY tags_update ON tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY tags_delete ON tags FOR DELETE USING (auth.uid() = user_id);

-- ── recurring_items ───────────────────────────────────────────────────────
CREATE POLICY recurring_select ON recurring_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY recurring_insert ON recurring_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY recurring_update ON recurring_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY recurring_delete ON recurring_items FOR DELETE USING (auth.uid() = user_id);

-- ── transactions ──────────────────────────────────────────────────────────
CREATE POLICY transactions_select ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY transactions_insert ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY transactions_update ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY transactions_delete ON transactions FOR DELETE USING (auth.uid() = user_id);

-- ── transaction_tags  (ownership via transactions) ────────────────────────
CREATE POLICY txn_tags_select ON transaction_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE  t.id = transaction_id AND t.user_id = auth.uid()
    )
  );
CREATE POLICY txn_tags_insert ON transaction_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE  t.id = transaction_id AND t.user_id = auth.uid()
    )
  );
CREATE POLICY txn_tags_delete ON transaction_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE  t.id = transaction_id AND t.user_id = auth.uid()
    )
  );

-- ── budgets ───────────────────────────────────────────────────────────────
CREATE POLICY budgets_select ON budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY budgets_insert ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY budgets_update ON budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY budgets_delete ON budgets FOR DELETE USING (auth.uid() = user_id);

-- ── saving_goals ──────────────────────────────────────────────────────────
CREATE POLICY goals_select ON saving_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY goals_insert ON saving_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY goals_update ON saving_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY goals_delete ON saving_goals FOR DELETE USING (auth.uid() = user_id);

-- ── goal_contributions  (ownership via saving_goals) ─────────────────────
CREATE POLICY goal_contrib_select ON goal_contributions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM saving_goals g WHERE g.id = goal_id AND g.user_id = auth.uid())
  );
CREATE POLICY goal_contrib_insert ON goal_contributions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM saving_goals g WHERE g.id = goal_id AND g.user_id = auth.uid())
  );
CREATE POLICY goal_contrib_update ON goal_contributions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM saving_goals g WHERE g.id = goal_id AND g.user_id = auth.uid())
  );
CREATE POLICY goal_contrib_delete ON goal_contributions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM saving_goals g WHERE g.id = goal_id AND g.user_id = auth.uid())
  );

-- ── notifications ────────────────────────────────────────────────────────
CREATE POLICY notif_select ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY notif_update ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY notif_delete ON notifications FOR DELETE USING (auth.uid() = user_id);

-- ── notification_preferences ─────────────────────────────────────────────
CREATE POLICY notif_prefs_select ON notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY notif_prefs_insert ON notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY notif_prefs_update ON notification_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY notif_prefs_delete ON notification_preferences FOR DELETE USING (auth.uid() = user_id);

-- ── monthly_snapshots ────────────────────────────────────────────────────
CREATE POLICY snapshots_select ON monthly_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY snapshots_insert ON monthly_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY snapshots_update ON monthly_snapshots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY snapshots_delete ON monthly_snapshots FOR DELETE USING (auth.uid() = user_id);


-- ┌─────────────────────────────────────────────────────────┐
-- │ 6. ESSENTIAL SEED DATA  (required before first signup)  │
-- └─────────────────────────────────────────────────────────┘
-- Minimal currencies needed so profiles.currency_code DEFAULT 'ARS'
-- does not violate the FK on the very first user creation.
-- Full currency list and system categories live in seed.sql.

INSERT INTO currencies (code, name, symbol, decimal_places, is_active) VALUES
  ('ARS', 'Peso Argentino',        '$',   2, true),
  ('USD', 'Dólar Estadounidense',  'US$', 2, true),
  ('EUR', 'Euro',                  '€',   2, true)
ON CONFLICT (code) DO NOTHING;

-- Fixed UUIDs allow application code to reference account types by ID
-- without a lookup query.
INSERT INTO account_types (id, name, nature, icon, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'checking',     'asset',     'landmark',    1),
  ('00000000-0000-0000-0000-000000000002', 'savings',      'asset',     'piggy-bank',  2),
  ('00000000-0000-0000-0000-000000000003', 'credit_card',  'liability', 'credit-card', 3),
  ('00000000-0000-0000-0000-000000000004', 'investment',   'asset',     'trending-up', 4),
  ('00000000-0000-0000-0000-000000000005', 'cash',         'asset',     'banknote',    5),
  ('00000000-0000-0000-0000-000000000006', 'loan',         'liability', 'handshake',   6)
ON CONFLICT (id) DO NOTHING;
