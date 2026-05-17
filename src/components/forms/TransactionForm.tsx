'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { CurrencySelect } from '@/components/shared/CurrencySelect'
import { ExchangeRateSelector } from './ExchangeRateSelector'
import type { RateOption } from '@/lib/exchange-rates'
import { transactionSchema, type TransactionFormValues } from '@/lib/validations/transaction'

// Custom resolver: calls Zod directly, bypassing @hookform/resolvers v5 quirks with Zod v4
const transactionResolver: Resolver<TransactionFormValues> = async (values) => {
  // Debug — visible in Vercel runtime logs to diagnose NaN/empty issues
  if (typeof window !== 'undefined') {
    console.log('[TransactionForm] submit values:', JSON.stringify(values))
  }
  const result = transactionSchema.safeParse(values)
  if (result.success) return { values: result.data, errors: {} }
  const errors: Record<string, { type: string; message: string }> = {}
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || 'root'
    if (!errors[key]) errors[key] = { type: 'validation', message: issue.message }
  }
  console.log('[TransactionForm] errors:', JSON.stringify(errors))
  return { values: {}, errors }
}
import type { AccountWithType } from '@/lib/supabase/queries/accounts'
import type { CategoryWithParent } from '@/lib/supabase/queries/categories'
import type { TransactionWithRelations } from '@/lib/supabase/queries/transactions'
import { FormShell } from '@/components/ui/form-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: AccountWithType[]
  categories: CategoryWithParent[]
  defaultCurrency?: string
  transaction?: TransactionWithRelations
  onSubmit: (values: TransactionFormValues) => void
  isPending?: boolean
}

const TYPE_LABELS = {
  income: 'Ingreso',
  expense: 'Gasto',
  transfer: 'Transferencia',
} as const

export function TransactionForm({
  open,
  onOpenChange,
  accounts,
  categories,
  defaultCurrency = 'ARS',
  transaction,
  onSubmit,
  isPending,
}: Props) {
  const isEdit = !!transaction
  const [selectedRateType, setSelectedRateType] = useState('oficial')

  const form = useForm<TransactionFormValues>({
    resolver: transactionResolver,
    defaultValues: {
      transaction_type: 'expense',
      account_id: '',
      transfer_account_id: null,
      category_id: null,
      currency_code: defaultCurrency,
      exchange_rate: 1,
      exchange_rate_type: 'oficial',
      amount: 0,
      description: '',
      notes: '',
      transaction_date: new Date().toISOString().split('T')[0] ?? '',
      is_reconciled: false,
    },
  })

  const watchedCurrency = form.watch('currency_code')
  const watchedAmount = form.watch('amount')
  const watchedAccountId = form.watch('account_id')

  // Auto-fill currency when account changes
  useEffect(() => {
    if (!watchedAccountId) return
    const account = accounts.find((a) => a.id === watchedAccountId)
    if (account?.currency_code) {
      form.setValue('currency_code', account.currency_code)
    }
  }, [watchedAccountId, accounts, form])

  function handleRateSelect(opt: RateOption) {
    form.setValue('exchange_rate', opt.rate)
    form.setValue('exchange_rate_type', opt.type)
    setSelectedRateType(opt.type)
  }

  const txType = form.watch('transaction_type')
  const isTransfer = txType === 'transfer'

  useEffect(() => {
    if (transaction) {
      form.reset({
        transaction_type: transaction.transaction_type as TransactionFormValues['transaction_type'],
        account_id: transaction.account_id,
        transfer_account_id: transaction.transfer_account_id ?? null,
        category_id: transaction.category_id ?? null,
        currency_code: transaction.currency_code,
        amount: transaction.amount,
        description: transaction.description ?? '',
        notes: transaction.notes ?? '',
        transaction_date: transaction.transaction_date,
        is_reconciled: transaction.is_reconciled ?? false,
      })
    } else {
      form.reset({
        transaction_type: 'expense',
        account_id: '',
        transfer_account_id: null,
        category_id: null,
        currency_code: defaultCurrency,
        amount: 0,
        description: '',
        notes: '',
        transaction_date: new Date().toISOString().split('T')[0] ?? '',
        is_reconciled: false,
      })
    }
  }, [transaction, form, defaultCurrency])

  const filteredCategories = isTransfer
    ? []
    : categories.filter(
        (c) => c.transaction_type === txType || c.transaction_type === null,
      )

  function handleSubmit() {
    void form.handleSubmit(onSubmit)()
  }

  const saveLabel = txType === 'income' ? 'Guardar ingreso' : txType === 'transfer' ? 'Guardar transferencia' : 'Guardar gasto'

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Editar transacción' : 'Nueva transacción'}
      primaryAction={
        <Button size="sm" onClick={handleSubmit} disabled={isPending}>
          {isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>

        {/* ── Mobile layout ── */}
        <div className="lg:hidden space-y-0">
          {/* Type segmented */}
          <div className="grid mb-5" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 4, padding: 4, background: 'var(--muted)', borderRadius: 10 }}>
            {(['expense', 'income', 'transfer'] as const).map((t) => (
              <button key={t} type="button"
                onClick={() => { form.setValue('transaction_type', t, { shouldValidate: true }); form.setValue('category_id', null); form.setValue('transfer_account_id', null) }}
                className={cn('rounded-lg py-2 text-[13px] font-medium transition-colors', txType === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}
                style={{ boxShadow: txType === t ? '0 1px 3px oklch(0 0 0 / 0.08)' : 'none' }}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          {/* Big amount */}
          <div className="text-center pb-6">
            <Controller control={form.control} name="amount" render={({ field }) => (
              <div className="flex items-start justify-center">
                <span className="text-muted-foreground mr-1 mt-2" style={{ fontSize: 22 }}>$</span>
                <input
                  type="text" inputMode="decimal"
                  placeholder="0"
                  value={field.value === 0 ? '' : String(field.value)}
                  onChange={(e) => { const n = parseFloat(e.target.value.replace(',', '.')); field.onChange(isNaN(n) ? 0 : n) }}
                  onBlur={field.onBlur}
                  className="bg-transparent border-0 outline-none text-center tabular-nums"
                  style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1, width: '6ch', minWidth: '3ch', maxWidth: '10ch' }}
                />
              </div>
            )} />
            <p className="text-xs-plus text-muted-foreground mt-2">{watchedCurrency} · {watchedCurrency !== defaultCurrency ? 'Tipo de cambio actual' : 'Moneda base'}</p>
            {form.formState.errors.amount && <p className="mt-1 text-xs text-destructive">{form.formState.errors.amount.message}</p>}
          </div>

          {/* Field rows */}
          <div className="rounded-xl border bg-card overflow-hidden divide-y divide-border">
            {/* Description */}
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-24 shrink-0">Descripción</span>
              <input {...form.register('description')} placeholder="Ej: Supermercado Día" className="flex-1 text-sm text-right bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground/50" />
            </div>

            {/* Category or transfer dest */}
            {!isTransfer ? (
              <div className="flex items-center gap-3 px-4 py-0">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-24 shrink-0">Categoría</span>
                <Controller control={form.control} name="category_id" render={({ field }) => {
                  const selected = filteredCategories.find((c) => c.id === field.value)
                  return (
                    <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || null)}>
                      <SelectTrigger className="flex-1 border-0 shadow-none bg-transparent pr-0 text-sm text-right justify-end h-12">
                        <SelectValue placeholder="Sin categoría">{selected ? `${selected.icon ?? ''} ${selected.name}` : 'Sin categoría'}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>{filteredCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.icon ?? ''} {c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  )
                }} />
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-0">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-24 shrink-0">Destino</span>
                <Controller control={form.control} name="transfer_account_id" render={({ field }) => {
                  const selected = accounts.find((a) => a.id === field.value)
                  return (
                    <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || null)}>
                      <SelectTrigger className="flex-1 border-0 shadow-none bg-transparent pr-0 text-sm text-right justify-end h-12">
                        <SelectValue placeholder="Cuenta destino">{selected ? `${selected.icon ?? ''} ${selected.name}` : undefined}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.icon ?? ''} {a.name}</SelectItem>)}</SelectContent>
                    </Select>
                  )
                }} />
              </div>
            )}

            {/* Account */}
            <div className="flex items-center gap-3 px-4 py-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-24 shrink-0">Cuenta</span>
              <Controller control={form.control} name="account_id" render={({ field }) => {
                const selected = accounts.find((a) => a.id === field.value)
                return (
                  <Select value={field.value} onValueChange={(v) => field.onChange(v ?? '')}>
                    <SelectTrigger className="flex-1 border-0 shadow-none bg-transparent pr-0 text-sm text-right justify-end h-12">
                      <SelectValue placeholder="Seleccioná una cuenta">{selected ? `${selected.icon ?? ''} ${selected.name}` : undefined}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.icon ?? ''} {a.name}</SelectItem>)}</SelectContent>
                  </Select>
                )
              }} />
            </div>

            {/* Date */}
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-24 shrink-0">Fecha</span>
              <input type="date" {...form.register('transaction_date')} className="flex-1 text-sm text-right bg-transparent border-0 outline-none text-foreground" />
            </div>
          </div>

          {/* Exchange rate (if needed) */}
          {watchedCurrency !== defaultCurrency && (
            <div className="mt-4">
              <ExchangeRateSelector fromCurrency={watchedCurrency} toCurrency={defaultCurrency} amount={watchedAmount ?? 0} selectedType={selectedRateType} onSelect={handleRateSelect} />
            </div>
          )}

          {/* Save button at bottom */}
          <button type="button" onClick={handleSubmit} disabled={isPending}
            className="mt-5 w-full rounded-xl py-3.5 text-[15px] font-semibold transition-colors"
            style={{ background: 'var(--foreground)', color: 'var(--background)' }}
          >
            {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : saveLabel}
          </button>
        </div>

        {/* ── Desktop layout ── */}
        <div className="hidden lg:block space-y-4">
          {/* Type toggle */}
          <div className="flex gap-1 rounded-lg border p-1">
            {(['income', 'expense', 'transfer'] as const).map((t) => (
              <button key={t} type="button"
                onClick={() => { form.setValue('transaction_type', t, { shouldValidate: true }); form.setValue('category_id', null); form.setValue('transfer_account_id', null) }}
                className={cn('flex-1 rounded-md py-1.5 text-xs font-medium transition-colors', txType === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="amount-d">Monto</Label>
              <Controller control={form.control} name="amount" render={({ field }) => (
                <Input id="amount-d" type="text" inputMode="decimal" placeholder="0.00"
                  value={field.value === 0 ? '' : String(field.value)}
                  onChange={(e) => { const n = parseFloat(e.target.value.replace(',', '.')); field.onChange(isNaN(n) ? 0 : n) }}
                  onBlur={field.onBlur} className="mt-1" />
              )} />
              {form.formState.errors.amount && <p className="mt-1 text-xs text-destructive">{form.formState.errors.amount.message}</p>}
            </div>
            <div className="w-32">
              <Label>Moneda</Label>
              <Controller control={form.control} name="currency_code" render={({ field }) => (
                <CurrencySelect value={field.value} onValueChange={field.onChange} className="mt-1 w-full" />
              )} />
            </div>
          </div>

          {watchedCurrency !== defaultCurrency && (
            <ExchangeRateSelector fromCurrency={watchedCurrency} toCurrency={defaultCurrency} amount={watchedAmount ?? 0} selectedType={selectedRateType} onSelect={handleRateSelect} />
          )}

          <div>
            <Label htmlFor="transaction_date-d">Fecha</Label>
            <Input id="transaction_date-d" type="date" {...form.register('transaction_date')} className="mt-1" />
          </div>

          <div>
            <Label>Cuenta {isTransfer ? 'origen' : ''}</Label>
            <Controller control={form.control} name="account_id" render={({ field }) => {
              const selected = accounts.find((a) => a.id === field.value)
              return (
                <Select value={field.value} onValueChange={(v) => field.onChange(v ?? '')}>
                  <SelectTrigger className="mt-1 w-full"><SelectValue placeholder="Seleccioná una cuenta">{selected ? `${selected.icon ?? ''} ${selected.name}` : undefined}</SelectValue></SelectTrigger>
                  <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.icon ?? ''} {a.name}</SelectItem>)}</SelectContent>
                </Select>
              )
            }} />
          </div>

          {isTransfer ? (
            <div>
              <Label>Cuenta destino</Label>
              <Controller control={form.control} name="transfer_account_id" render={({ field }) => {
                const selected = accounts.find((a) => a.id === field.value)
                return (
                  <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || null)}>
                    <SelectTrigger className="mt-1 w-full"><SelectValue placeholder="Seleccioná cuenta destino">{selected ? `${selected.icon ?? ''} ${selected.name}` : undefined}</SelectValue></SelectTrigger>
                    <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.icon ?? ''} {a.name}</SelectItem>)}</SelectContent>
                  </Select>
                )
              }} />
            </div>
          ) : (
            <div>
              <Label>Categoría</Label>
              <Controller control={form.control} name="category_id" render={({ field }) => {
                const selected = filteredCategories.find((c) => c.id === field.value)
                return (
                  <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || null)}>
                    <SelectTrigger className="mt-1 w-full"><SelectValue placeholder="Seleccioná una categoría">{selected ? `${selected.icon ?? ''} ${selected.name}` : undefined}</SelectValue></SelectTrigger>
                    <SelectContent>{filteredCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.icon ?? ''} {c.name}</SelectItem>)}</SelectContent>
                  </Select>
                )
              }} />
            </div>
          )}

          <div>
            <Label htmlFor="description-d">Descripción</Label>
            <Input id="description-d" placeholder="Ej: Supermercado Día" {...form.register('description')} className="mt-1" />
          </div>

          <div>
            <Label htmlFor="notes-d">Notas (opcional)</Label>
            <Input id="notes-d" placeholder="Notas adicionales..." {...form.register('notes')} className="mt-1" />
          </div>
        </div>

      </form>
    </FormShell>
  )
}
