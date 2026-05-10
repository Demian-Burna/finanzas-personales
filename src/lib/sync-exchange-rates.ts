'use server'

import { createClient } from '@/lib/supabase/server'
import { getExchangeRates } from '@/lib/exchange-rates'

// All unique foreign currencies we track. Extend as needed.
const FOREIGN_CURRENCIES = ['USD', 'EUR', 'BRL', 'CLP', 'UYU', 'GBP', 'CHF', 'CAD', 'PEN', 'BOB', 'COP', 'MXN']

/**
 * Fetches fresh exchange rates and upserts them into exchange_rate_cache.
 * Called when creating transactions and by the monthly cron job.
 */
export async function syncExchangeRates(baseCurrency = 'ARS'): Promise<void> {
  const supabase = await createClient()

  for (const foreign of FOREIGN_CURRENCIES) {
    if (foreign === baseCurrency) continue
    try {
      const data = await getExchangeRates(foreign, baseCurrency)
      if (!data) continue

      const rows = data.options.map((opt) => ({
        from_currency: foreign,
        to_currency: baseCurrency,
        rate: opt.rate,
        rate_type: opt.type,
        fetched_at: new Date().toISOString(),
      }))

      await supabase
        .from('exchange_rate_cache')
        .upsert(rows as never, { onConflict: 'from_currency,to_currency,rate_type' })
    } catch {
      // Non-fatal — RPC falls back to 1:1 if no rate stored
    }
  }
}
