'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { budgetSchema, type BudgetInput } from '@/lib/validations/budget'
import type { CategoryWithParent } from '@/lib/supabase/queries/categories'
import type { BudgetWithProgress } from '@/lib/supabase/queries/budgets'
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
import { CurrencySelect } from '@/components/shared/CurrencySelect'
import { CategoryCombobox } from '@/components/shared/CategoryCombobox'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: CategoryWithParent[]
  defaultCurrency?: string
  budget?: BudgetWithProgress
  onSubmit: (values: BudgetInput) => void
  isPending?: boolean
}

const PERIOD_OPTIONS = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'weekly',  label: 'Semanal' },
  { value: 'yearly',  label: 'Anual' },
  { value: 'custom',  label: 'Personalizado' },
] as const

// Custom resolver — bypass zodResolver/Zod v4 incompatibility
const budgetResolver: Resolver<BudgetInput> = async (values) => {
  const result = budgetSchema.safeParse(values)
  if (result.success) return { values: result.data, errors: {} }
  const errors: Record<string, { type: string; message: string }> = {}
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || 'root'
    if (!errors[key]) errors[key] = { type: 'validation', message: issue.message }
  }
  return { values: {}, errors }
}

// Only leaf categories (expense categories that aren't parents)
function leafCategories(categories: CategoryWithParent[]) {
  const parentIds = new Set(categories.map((c) => c.parent_id).filter(Boolean))
  return categories.filter((c) => !parentIds.has(c.id))
}

export function BudgetForm({
  open,
  onOpenChange,
  categories,
  defaultCurrency = 'ARS',
  budget,
  onSubmit,
  isPending,
}: Props) {
  const isEdit = !!budget
  const leaves = leafCategories(categories)

  const form = useForm<BudgetInput>({
    resolver: budgetResolver,
    mode: 'onChange',
    defaultValues: {
      category_id: '',
      period_type: 'monthly',
      amount: 0,
      currency_code: defaultCurrency,
      start_date: new Date().toISOString().split('T')[0] ?? '',
      end_date: null,
      rollover_unused: false,
      alert_threshold_pct: 80,
    },
  })

  useEffect(() => {
    if (!open) return // only reset when dialog opens
    if (budget) {
      form.reset({
        category_id: budget.category_id,
        period_type: budget.period_type as BudgetInput['period_type'],
        amount: budget.amount,
        currency_code: budget.currency_code,
        start_date: budget.start_date,
        end_date: budget.end_date ?? null,
        rollover_unused: budget.rollover_unused,
        alert_threshold_pct: budget.alert_threshold_pct,
      })
    } else {
      form.reset({
        category_id: '',
        period_type: 'monthly',
        amount: 0,
        currency_code: defaultCurrency,
        start_date: new Date().toISOString().split('T')[0] ?? '',
        end_date: null,
        rollover_unused: false,
        alert_threshold_pct: 80,
      })
    }
  }, [open, budget, form, defaultCurrency])

  const alertThreshold = form.watch('alert_threshold_pct')
  const rollover = form.watch('rollover_unused')
  const periodValue = form.watch('period_type')
  const selectedPeriod = PERIOD_OPTIONS.find((o) => o.value === periodValue)

  function handleSubmit() {
    void form.handleSubmit(onSubmit)()
  }

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Editar presupuesto' : 'Nuevo presupuesto'}
      primaryAction={
        <Button size="sm" onClick={handleSubmit} disabled={isPending}>
          {isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>

        {/* ── Mobile layout ── */}
        <div className="lg:hidden space-y-0">

          {/* Category chips */}
          <div className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Categoría</p>
            <div className="flex flex-wrap gap-1.5">
              <Controller control={form.control} name="category_id" render={({ field }) => (
                <>
                  {leaves.slice(0, 8).map((c) => {
                    const selected = field.value === c.id
                    return (
                      <button key={c.id} type="button" onClick={() => field.onChange(selected ? '' : c.id)}
                        className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors"
                        style={{
                          border: selected ? '1.5px solid var(--foreground)' : '1px solid var(--border)',
                          background: selected ? 'var(--foreground)' : 'var(--card)',
                          color: selected ? 'var(--background)' : 'var(--foreground)',
                        }}
                      >
                        {c.icon && <span>{c.icon}</span>}
                        {c.name}
                      </button>
                    )
                  })}
                </>
              )} />
            </div>
            {form.formState.errors.category_id && <p className="mt-1 text-xs text-destructive">{form.formState.errors.category_id.message}</p>}
          </div>

          {/* Big amount + period */}
          <div className="rounded-xl border bg-card overflow-hidden mb-4">
            {/* Big amount */}
            <div className="text-center py-5 border-b border-border">
              <Controller control={form.control} name="amount" render={({ field }) => (
                <div className="flex items-start justify-center">
                  <span className="text-muted-foreground mr-1 mt-1" style={{ fontSize: 18, verticalAlign: 'top' }}>$</span>
                  <input type="text" inputMode="decimal" placeholder="0"
                    value={field.value === 0 ? '' : String(field.value)}
                    onChange={(e) => { const n = parseFloat(e.target.value.replace(',', '.')); field.onChange(isNaN(n) ? 0 : n) }}
                    onBlur={field.onBlur}
                    className="bg-transparent border-0 outline-none text-center tabular-nums"
                    style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, width: '7ch', minWidth: '3ch' }}
                  />
                </div>
              )} />
              <p className="text-xs-plus text-muted-foreground mt-1.5">ARS · tocá para cambiar</p>
              {form.formState.errors.amount && <p className="mt-1 text-xs text-destructive">{form.formState.errors.amount.message}</p>}
            </div>

            {/* Period segmented */}
            <div className="p-2">
              <Controller control={form.control} name="period_type" render={({ field }) => (
                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 4, padding: 4, background: 'var(--muted)', borderRadius: 10 }}>
                  {PERIOD_OPTIONS.map((o) => (
                    <button key={o.value} type="button" onClick={() => field.onChange(o.value)}
                      className="rounded-lg py-2 text-[11.5px] font-medium transition-colors"
                      style={{
                        background: field.value === o.value ? 'var(--background)' : 'transparent',
                        boxShadow: field.value === o.value ? '0 1px 3px oklch(0 0 0 / 0.08)' : 'none',
                        color: field.value === o.value ? 'var(--foreground)' : 'var(--muted-foreground)',
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )} />
            </div>
          </div>

          {/* Alert threshold slider */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-4 pt-3.5 pb-0">Alertas</p>
            <div className="px-4 py-3.5 border-b border-border">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-[13.5px] font-medium">Avisar cuando llegue al…</span>
                <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--accent)' }}>{alertThreshold}%</span>
              </div>
              <div className="relative h-1.5 rounded-full bg-muted">
                <div className="absolute left-0 top-0 bottom-0 rounded-full" style={{ width: `${((alertThreshold - 50) / 50) * 100}%`, background: 'var(--accent)' }} />
              </div>
              <input type="range" min={50} max={100} step={5}
                {...form.register('alert_threshold_pct', { valueAsNumber: true })}
                className="w-full mt-2" style={{ accentColor: 'var(--accent)' }}
              />
              <div className="flex justify-between">
                <span className="text-[10px] text-muted-foreground">50%</span>
                <span className="text-[10px] text-muted-foreground">100%</span>
              </div>
            </div>

            {/* Rollover row */}
            <div className="flex items-center justify-between px-4 py-3.5">
              <div>
                <p className="text-[13.5px] font-medium">Acumulado</p>
                <p className="text-xs-plus text-muted-foreground">{rollover ? 'Sí reinicia mes a mes' : 'No reinicia mes a mes'}</p>
              </div>
              <button type="button" role="switch" aria-checked={rollover} onClick={() => form.setValue('rollover_unused', !rollover)}
                className="relative inline-flex shrink-0 items-center rounded-full transition-colors"
                style={{ width: 38, height: 22, background: rollover ? 'var(--success)' : 'var(--muted)', padding: 2 }}
              >
                <span className="inline-block rounded-full bg-white shadow transition-transform"
                  style={{ width: 18, height: 18, transform: rollover ? 'translateX(16px)' : 'translateX(0)' }} />
              </button>
            </div>
          </div>

          {/* Save button */}
          <button type="button" onClick={handleSubmit} disabled={isPending}
            className="mt-5 w-full rounded-xl py-3.5 text-[15px] font-semibold transition-colors"
            style={{ background: 'var(--foreground)', color: 'var(--background)' }}
          >
            {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear presupuesto'}
          </button>
        </div>

        {/* ── Desktop layout ── */}
        <div className="hidden lg:block space-y-4">
          {/* Category — searchable combobox */}
          <div>
            <Label>Categoría</Label>
            <Controller
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <CategoryCombobox
                  categories={leaves}
                  value={field.value || null}
                  onChange={(id) => field.onChange(id ?? '')}
                  className="mt-1"
                />
              )}
            />
            {form.formState.errors.category_id && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.category_id.message}
              </p>
            )}
          </div>

          {/* Period type */}
          <div>
            <Label>Período</Label>
            <Controller
              control={form.control}
              name="period_type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue>
                      {selectedPeriod?.label ?? 'Seleccioná un período'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {PERIOD_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Amount + currency */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Monto límite</Label>
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
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>
            <div className="w-36">
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

          {/* Start date */}
          <div>
            <Label>Fecha de inicio</Label>
            <Input
              type="date"
              {...form.register('start_date')}
              className="mt-1"
            />
          </div>

          {/* Alert threshold */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Umbral de alerta</Label>
              <span className="text-xs font-semibold text-muted-foreground">{alertThreshold}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={100}
              step={5}
              {...form.register('alert_threshold_pct', { valueAsNumber: true })}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Rollover toggle */}
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Acumular sobrante</p>
              <p className="text-xs text-muted-foreground">El saldo no gastado pasa al siguiente período</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={rollover}
              onClick={() => form.setValue('rollover_unused', !rollover)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${rollover ? 'bg-primary' : 'bg-muted'}`}
            >
              <span
                className={`inline-block size-3.5 rounded-full bg-white shadow transition-transform ${rollover ? 'translate-x-4' : 'translate-x-0.5'}`}
              />
            </button>
          </div>
        </div>{/* end desktop */}

      </form>
    </FormShell>
  )
}
