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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar transacción' : 'Nueva transacción'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2" noValidate>
          {/* Type toggle */}
          <div className="flex gap-1 rounded-lg border p-1">
            {(['income', 'expense', 'transfer'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  form.setValue('transaction_type', t, { shouldValidate: true })
                  form.setValue('category_id', null)
                  form.setValue('transfer_account_id', null)
                }}
                className={cn(
                  'flex-1 rounded-md py-1.5 text-xs font-medium transition-colors',
                  txType === t
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          {/* Amount + currency row */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="amount">Monto</Label>
              {/* Use Controller + text input to avoid valueAsNumber NaN inside Dialog */}
              <Controller
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <Input
                    id="amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={field.value === 0 ? '' : String(field.value)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(',', '.')
                      const parsed = parseFloat(raw)
                      field.onChange(isNaN(parsed) ? 0 : parsed)
                    }}
                    onBlur={field.onBlur}
                    className="mt-1"
                  />
                )}
              />
              {form.formState.errors.amount && (
                <p className="mt-1 text-xs text-destructive">{form.formState.errors.amount.message}</p>
              )}
            </div>
            <div className="w-32">
              <Label>Moneda</Label>
              <Controller
                control={form.control}
                name="currency_code"
                render={({ field }) => (
                  <CurrencySelect
                    value={field.value}
                    onValueChange={field.onChange}
                    className="mt-1 w-full"
                  />
                )}
              />
            </div>
          </div>

          {/* Exchange rate selector — shown when currency differs from base */}
          {watchedCurrency !== defaultCurrency && (
            <ExchangeRateSelector
              fromCurrency={watchedCurrency}
              toCurrency={defaultCurrency}
              amount={watchedAmount ?? 0}
              selectedType={selectedRateType}
              onSelect={handleRateSelect}
            />
          )}

          {/* Date */}
          <div>
            <Label htmlFor="transaction_date">Fecha</Label>
            <Input
              id="transaction_date"
              type="date"
              {...form.register('transaction_date')}
              className="mt-1"
            />
            {form.formState.errors.transaction_date && (
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.transaction_date.message}</p>
            )}
          </div>

          {/* Origin account */}
          <div>
            <Label>Cuenta {isTransfer ? 'origen' : ''}</Label>
            <Controller
              control={form.control}
              name="account_id"
              render={({ field }) => {
                const selected = accounts.find((a) => a.id === field.value)
                return (
                  <Select value={field.value} onValueChange={(v) => field.onChange(v ?? '')}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Seleccioná una cuenta">
                        {selected ? `${selected.icon ?? ''} ${selected.name}` : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.icon ?? ''} {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )
              }}
            />
            {form.formState.errors.account_id && (
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.account_id.message}</p>
            )}
          </div>

          {/* Transfer destination OR category */}
          {isTransfer ? (
            <div>
              <Label>Cuenta destino</Label>
              <Controller
                control={form.control}
                name="transfer_account_id"
                render={({ field }) => {
                  const selected = accounts.find((a) => a.id === field.value)
                  return (
                    <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || null)}>
                      <SelectTrigger className="mt-1 w-full">
                        <SelectValue placeholder="Seleccioná cuenta destino">
                          {selected ? `${selected.icon ?? ''} ${selected.name}` : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.icon ?? ''} {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                }}
              />
              {form.formState.errors.transfer_account_id && (
                <p className="mt-1 text-xs text-destructive">{form.formState.errors.transfer_account_id.message}</p>
              )}
            </div>
          ) : (
            <div>
              <Label>Categoría</Label>
              <Controller
                control={form.control}
                name="category_id"
                render={({ field }) => {
                  const selected = filteredCategories.find((c) => c.id === field.value)
                  return (
                    <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || null)}>
                      <SelectTrigger className="mt-1 w-full">
                        <SelectValue placeholder="Seleccioná una categoría">
                          {selected ? `${selected.icon ?? ''} ${selected.name}` : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.icon ?? ''} {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                }}
              />
              {form.formState.errors.category_id && (
                <p className="mt-1 text-xs text-destructive">{form.formState.errors.category_id.message}</p>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              placeholder="Ej: Supermercado Día"
              {...form.register('description')}
              className="mt-1"
            />
            {form.formState.errors.description && (
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Input
              id="notes"
              placeholder="Notas adicionales..."
              {...form.register('notes')}
              className="mt-1"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear transacción'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
