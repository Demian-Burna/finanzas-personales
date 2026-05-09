'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import type { completeOnboarding } from '../actions'

interface AccountType {
  id: string
  name: string
  nature: 'asset' | 'liability'
  icon: string | null
}

interface Props {
  accountTypes: AccountType[]
  completeOnboardingAction: typeof completeOnboarding
}

const CURRENCIES = [
  { code: 'ARS', label: 'Peso Argentino (ARS)' },
  { code: 'USD', label: 'Dólar Estadounidense (USD)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'BRL', label: 'Real Brasileño (BRL)' },
  { code: 'UYU', label: 'Peso Uruguayo (UYU)' },
  { code: 'CLP', label: 'Peso Chileno (CLP)' },
  { code: 'COP', label: 'Peso Colombiano (COP)' },
  { code: 'MXN', label: 'Peso Mexicano (MXN)' },
  { code: 'GBP', label: 'Libra Esterlina (GBP)' },
]

const TIMEZONES = [
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
  { value: 'America/Montevideo', label: 'Montevideo (GMT-3)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (GMT-3)' },
  { value: 'America/Santiago', label: 'Santiago (GMT-4)' },
  { value: 'America/Bogota', label: 'Bogotá (GMT-5)' },
  { value: 'America/Lima', label: 'Lima (GMT-5)' },
  { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
  { value: 'Europe/Madrid', label: 'Madrid (GMT+1)' },
  { value: 'UTC', label: 'UTC (GMT+0)' },
]

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: 'Cuenta corriente',
  savings: 'Caja de ahorro',
  cash: 'Efectivo',
  credit_card: 'Tarjeta de crédito',
  investment: 'Inversiones',
  loan: 'Préstamo',
}

const STEP_LABELS = ['Preferencias', 'Primera cuenta', 'Listo']

export function OnboardingWizard({ accountTypes, completeOnboardingAction }: Props) {
  const [step, setStep] = useState(1)
  const [isPending, startTransition] = useTransition()

  const [currency, setCurrency] = useState('ARS')
  const [timezone, setTimezone] = useState('America/Argentina/Buenos_Aires')
  const [accountTypeId, setAccountTypeId] = useState(accountTypes[0]?.id ?? '')
  const [accountName, setAccountName] = useState('')
  const [initialBalance, setInitialBalance] = useState('0')

  const assetTypes = accountTypes.filter((t) => t.nature === 'asset')

  function handleFinish() {
    startTransition(async () => {
      await completeOnboardingAction({
        currency_code: currency,
        timezone,
        locale: 'es-AR',
        account_type_id: accountTypeId,
        account_name: accountName.trim() || 'Mi cuenta',
        initial_balance: parseFloat(initialBalance) || 0,
      })
    })
  }

  return (
    <div className="mx-auto w-full max-w-md">
      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-between">
        {STEP_LABELS.map((label, i) => {
          const num = i + 1
          const active = num === step
          const done = num < step
          return (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex size-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    done
                      ? 'bg-primary text-primary-foreground'
                      : active
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {done ? '✓' : num}
                </div>
                <span className={`text-xs ${active ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className={`mx-2 mb-4 h-px flex-1 ${done ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Step 1 — Currency & timezone */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">¿Dónde estás?</h2>
            <p className="text-sm text-muted-foreground">Elegí tu moneda principal y zona horaria</p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="currency">
                Moneda principal
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="timezone">
                Zona horaria
              </label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button className="w-full" onClick={() => setStep(2)}>
            Continuar →
          </Button>
        </div>
      )}

      {/* Step 2 — First account */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Tu primera cuenta</h2>
            <p className="text-sm text-muted-foreground">
              Podés agregar más cuentas después en Configuración
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tipo de cuenta</label>
              <div className="grid grid-cols-2 gap-2">
                {assetTypes.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setAccountTypeId(t.id)}
                    className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                      accountTypeId === t.id
                        ? 'border-primary bg-primary/5 text-primary font-medium'
                        : 'border-border hover:border-muted-foreground/50'
                    }`}
                  >
                    {ACCOUNT_TYPE_LABELS[t.name] ?? t.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="account-name">
                Nombre de la cuenta
              </label>
              <input
                id="account-name"
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Ej: Banco Nación, Cuenta en efectivo…"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="balance">
                Saldo inicial ({currency})
              </label>
              <input
                id="balance"
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
              ← Atrás
            </Button>
            <Button className="flex-1" onClick={() => setStep(3)}>
              Continuar →
            </Button>
          </div>
        </div>
      )}

      {/* Step 3 — Confirm */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">¡Todo listo! 🎉</h2>
            <p className="text-sm text-muted-foreground">Revisá tu configuración antes de empezar</p>
          </div>

          <div className="rounded-xl border bg-muted/40 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Moneda</span>
              <span className="font-medium">{currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Zona horaria</span>
              <span className="font-medium">
                {TIMEZONES.find((t) => t.value === timezone)?.label ?? timezone}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Primera cuenta</span>
              <span className="font-medium">{accountName.trim() || 'Mi cuenta'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Saldo inicial</span>
              <span className="font-medium">
                {parseFloat(initialBalance || '0').toLocaleString('es-AR', {
                  style: 'currency',
                  currency,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep(2)} disabled={isPending}>
              ← Atrás
            </Button>
            <Button className="flex-1" onClick={handleFinish} disabled={isPending}>
              {isPending ? 'Guardando…' : 'Comenzar →'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
