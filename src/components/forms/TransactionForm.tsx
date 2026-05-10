'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { transactionSchema, type TransactionFormValues } from '@/lib/validations/transaction'
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

  const form = useForm<TransactionFormValues>({
    // Cast needed: @hookform/resolvers v5 infers Zod v4 input type (optional fields)
    // but our form values use the output type (all required).
    resolver: zodResolver(transactionSchema) as Resolver<TransactionFormValues>,
    defaultValues: {
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
    },
  })

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
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...form.register('amount', { valueAsNumber: true })}
                className="mt-1"
              />
              {form.formState.errors.amount && (
                <p className="mt-1 text-xs text-destructive">{form.formState.errors.amount.message}</p>
              )}
            </div>
            <div className="w-24">
              <Label htmlFor="currency">Moneda</Label>
              <Input
                id="currency"
                placeholder="ARS"
                {...form.register('currency_code')}
                className="mt-1 uppercase"
                maxLength={3}
              />
            </div>
          </div>

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
