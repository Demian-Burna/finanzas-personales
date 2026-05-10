'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { recurringItemSchema, type RecurringItemInput } from '@/lib/validations/recurring-item'
import type { AccountWithType } from '@/lib/supabase/queries/accounts'
import type { CategoryWithParent } from '@/lib/supabase/queries/categories'
import type { RecurringItemWithRelations } from '@/lib/supabase/queries/recurring-items'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CurrencySelect } from '@/components/shared/CurrencySelect'
import { CategoryCombobox } from '@/components/shared/CategoryCombobox'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: AccountWithType[]
  categories: CategoryWithParent[]
  defaultCurrency?: string
  item?: RecurringItemWithRelations
  onSubmit: (values: RecurringItemInput) => void
  isPending?: boolean
}

const FREQUENCY_OPTIONS = [
  { value: 'daily',      label: 'Diario' },
  { value: 'weekly',     label: 'Semanal' },
  { value: 'biweekly',   label: 'Quincenal' },
  { value: 'monthly',    label: 'Mensual' },
  { value: 'bimonthly',  label: 'Bimestral' },
  { value: 'quarterly',  label: 'Trimestral' },
  { value: 'yearly',     label: 'Anual' },
] as const

const TYPE_LABELS = { income: 'Ingreso', expense: 'Gasto' } as const

// Custom resolver — bypass zodResolver/Zod v4 incompatibility
const recurringResolver: Resolver<RecurringItemInput> = async (values) => {
  const result = recurringItemSchema.safeParse(values)
  if (result.success) return { values: result.data, errors: {} }
  const errors: Record<string, { type: string; message: string }> = {}
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || 'root'
    if (!errors[key]) errors[key] = { type: 'validation', message: issue.message }
  }
  return { values: {}, errors }
}

export function RecurringItemForm({
  open, onOpenChange, accounts, categories, defaultCurrency = 'ARS',
  item, onSubmit, isPending,
}: Props) {
  const isEdit = !!item

  const form = useForm<RecurringItemInput>({
    resolver: recurringResolver,
    mode: 'onChange',
    defaultValues: {
      transaction_type: 'expense',
      account_id: '',
      category_id: null,
      currency_code: defaultCurrency,
      amount: 0,
      description: '',
      frequency: 'monthly',
      start_date: new Date().toISOString().split('T')[0] ?? '',
      end_date: null,
      is_active: true,
      auto_create: false,
      advance_notice_days: 3,
    },
  })

  const txType     = form.watch('transaction_type')
  const frequency  = form.watch('frequency')
  const startDate  = form.watch('start_date')
  const autoCreate = form.watch('auto_create')
  const advanceDays = form.watch('advance_notice_days')

  const freqLabel = FREQUENCY_OPTIONS.find((o) => o.value === frequency)?.label ?? frequency
  const preview = startDate
    ? `Se repetirá ${freqLabel.toLowerCase()} desde el ${new Date(startDate + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}`
    : ''

  useEffect(() => {
    if (!open) return // only reset when dialog opens
    if (item) {
      form.reset({
        transaction_type: item.transaction_type as RecurringItemInput['transaction_type'],
        account_id: item.account_id,
        category_id: item.category_id ?? null,
        currency_code: item.currency_code,
        amount: item.amount,
        description: item.description,
        frequency: item.frequency as RecurringItemInput['frequency'],
        start_date: item.start_date,
        end_date: item.end_date ?? null,
        is_active: item.is_active,
        auto_create: item.auto_create,
        advance_notice_days: item.advance_notice_days,
      })
    } else {
      form.reset({
        transaction_type: 'expense', account_id: '', category_id: null,
        currency_code: defaultCurrency, amount: 0, description: '',
        frequency: 'monthly', start_date: new Date().toISOString().split('T')[0] ?? '',
        end_date: null, is_active: true, auto_create: false, advance_notice_days: 3,
      })
    }
  }, [open, item, form, defaultCurrency])

  const filteredCategories = categories.filter(
    (c) => c.transaction_type === txType || c.transaction_type === null,
  )

  const selectedAccount  = accounts.find((a) => a.id === form.watch('account_id'))
  const selectedFrequency = FREQUENCY_OPTIONS.find((o) => o.value === frequency)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar recurrente' : 'Nuevo recurrente'}</DialogTitle>
        </DialogHeader>

        <form noValidate className="space-y-4 pt-2">
          {/* Type toggle */}
          <div className="flex gap-1 rounded-lg border p-1">
            {(['income', 'expense'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { form.setValue('transaction_type', t); form.setValue('category_id', null) }}
                className={cn(
                  'flex-1 rounded-md py-1.5 text-xs font-medium transition-colors',
                  txType === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          {/* Description */}
          <div>
            <Label>Descripción</Label>
            <Input placeholder="Ej: Netflix, Alquiler..." {...form.register('description')} className="mt-1" />
            {form.formState.errors.description && (
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>

          {/* Amount + currency */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Monto</Label>
              <Controller
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={field.value === 0 ? '' : String(field.value)}
                    onChange={(e) => {
                      const n = parseFloat(e.target.value.replace(',', '.'))
                      field.onChange(isNaN(n) ? 0 : n)
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
            <div className="w-36">
              <Label>Moneda</Label>
              <Controller
                control={form.control}
                name="currency_code"
                render={({ field }) => (
                  <CurrencySelect value={field.value} onValueChange={field.onChange} className="mt-1 w-full" />
                )}
              />
            </div>
          </div>

          {/* Account */}
          <div>
            <Label>Cuenta</Label>
            <Controller
              control={form.control}
              name="account_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue>
                      {selectedAccount ? selectedAccount.name : <span className="text-muted-foreground">Seleccioná una cuenta</span>}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.account_id && (
              <p className="mt-1 text-xs text-destructive">{String(form.formState.errors.account_id.message)}</p>
            )}
          </div>

          {/* Category — searchable combobox */}
          <div>
            <Label>Categoría (opcional)</Label>
            <Controller
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <CategoryCombobox
                  categories={filteredCategories}
                  value={field.value ?? null}
                  onChange={field.onChange}
                  placeholder="Sin categoría"
                  className="mt-1"
                />
              )}
            />
          </div>

          {/* Frequency */}
          <div>
            <Label>Frecuencia</Label>
            <Controller
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue>
                      {selectedFrequency?.label ?? 'Seleccioná una frecuencia'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {preview && <p className="mt-1 text-xs text-muted-foreground">{preview}</p>}
          </div>

          {/* Start date */}
          <div>
            <Label>Fecha de inicio</Label>
            <Input type="date" {...form.register('start_date')} className="mt-1" />
          </div>

          {/* Advance notice */}
          <div>
            <div className="flex justify-between mb-1">
              <Label>Aviso anticipado</Label>
              <span className="text-xs font-semibold text-muted-foreground">
                {advanceDays} día{advanceDays !== 1 ? 's' : ''}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              {...form.register('advance_notice_days', { valueAsNumber: true })}
              className="w-full accent-primary"
            />
          </div>

          {/* Auto create toggle */}
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Crear automáticamente</p>
              <p className="text-xs text-muted-foreground">Genera la transacción sin intervención manual</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoCreate}
              onClick={() => form.setValue('auto_create', !autoCreate)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${autoCreate ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`inline-block size-3.5 rounded-full bg-white shadow transition-transform ${autoCreate ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={() => void form.handleSubmit(onSubmit)()}
            >
              {isPending ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
