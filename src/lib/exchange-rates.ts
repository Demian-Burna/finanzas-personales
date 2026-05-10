export interface RateOption {
  type: string
  label: string
  rate: number // units of toCurrency per 1 unit of fromCurrency
}

export interface ExchangeRateData {
  fromCurrency: string
  toCurrency: string
  options: RateOption[]
  lastUpdate: string
}

interface BluelyticsResponse {
  oficial: { value_buy: number; value_sell: number }
  blue: { value_buy: number; value_sell: number }
  oficial_euro: { value_buy: number; value_sell: number }
  blue_euro: { value_buy: number; value_sell: number }
  mep?: { value_buy: number; value_sell: number }
  ccl?: { value_buy: number; value_sell: number }
  last_update: string
}

interface OpenRatesResponse {
  rates: Record<string, number>
  time_last_update_utc?: string
}

async function fetchBluelytics(): Promise<BluelyticsResponse | null> {
  try {
    const res = await fetch('https://api.bluelytics.com.ar/v2/latest', {
      next: { revalidate: 1800 }, // 30 min cache
    })
    if (!res.ok) return null
    return res.json() as Promise<BluelyticsResponse>
  } catch {
    return null
  }
}

async function fetchOpenRates(from: string): Promise<OpenRatesResponse | null> {
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`, {
      next: { revalidate: 3600 }, // 1h cache
    })
    if (!res.ok) return null
    return res.json() as Promise<OpenRatesResponse>
  } catch {
    return null
  }
}

/**
 * Returns exchange rate options for converting `fromCurrency` → `toCurrency`.
 * Returns null if both currencies are the same or if data can't be fetched.
 */
export async function getExchangeRates(
  fromCurrency: string,
  toCurrency: string,
): Promise<ExchangeRateData | null> {
  const from = fromCurrency.toUpperCase()
  const to = toCurrency.toUpperCase()

  if (from === to) return null

  const lastUpdate = new Date().toISOString()

  // ── ARS as target ─────────────────────────────────────────────────────────
  if (to === 'ARS') {
    if (from === 'USD') {
      const data = await fetchBluelytics()
      if (!data) return null
      const options: RateOption[] = [
        { type: 'oficial',  label: 'Oficial',   rate: data.oficial.value_sell },
        { type: 'blue',     label: 'Blue',      rate: data.blue.value_sell },
      ]
      if (data.mep) options.push({ type: 'mep', label: 'MEP / Bolsa', rate: data.mep.value_sell })
      if (data.ccl) options.push({ type: 'ccl', label: 'CCL', rate: data.ccl.value_sell })
      return { fromCurrency: from, toCurrency: to, options, lastUpdate: data.last_update }
    }

    if (from === 'EUR') {
      const data = await fetchBluelytics()
      if (!data) return null
      return {
        fromCurrency: from, toCurrency: to,
        options: [
          { type: 'oficial', label: 'Oficial', rate: data.oficial_euro.value_sell },
          { type: 'blue',    label: 'Blue',    rate: data.blue_euro.value_sell },
        ],
        lastUpdate: data.last_update,
      }
    }

    // Other currency → ARS: try cross via USD
    const [blueData, ratesData] = await Promise.all([fetchBluelytics(), fetchOpenRates(from)])
    if (!ratesData?.rates?.USD || !blueData) return null
    const fromToUSD = ratesData.rates['USD'] ?? 1
    return {
      fromCurrency: from, toCurrency: to,
      options: [
        { type: 'oficial', label: 'Oficial', rate: (1 / fromToUSD) * blueData.oficial.value_sell },
        { type: 'blue',    label: 'Blue',    rate: (1 / fromToUSD) * blueData.blue.value_sell },
      ],
      lastUpdate,
    }
  }

  // ── ARS as source ─────────────────────────────────────────────────────────
  if (from === 'ARS') {
    const inverse = await getExchangeRates(to, from)
    if (!inverse) return null
    return {
      fromCurrency: from, toCurrency: to,
      options: inverse.options.map((o) => ({ ...o, rate: 1 / o.rate })),
      lastUpdate: inverse.lastUpdate,
    }
  }

  // ── Neither is ARS: direct market rate ───────────────────────────────────
  const ratesData = await fetchOpenRates(from)
  if (!ratesData?.rates?.[to]) return null
  return {
    fromCurrency: from, toCurrency: to,
    options: [{ type: 'market', label: 'Mercado', rate: ratesData.rates[to]! }],
    lastUpdate: ratesData.time_last_update_utc ?? lastUpdate,
  }
}
