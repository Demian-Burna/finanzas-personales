'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, MoreHorizontal, Edit, Power, PowerOff, Trash2, CreditCard } from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { format, differenceInDays, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { RecurringItemWithRelations } from '@/lib/supabase/queries/recurring-items'
import type { AccountWithType } from '@/lib/supabase/queries/accounts'
import type { CategoryWithParent } from '@/lib/supabase/queries/categories'
import type { RecurringItemInput } from '@/lib/validations/recurring-item'
import { RecurringItemForm } from '@/components/forms/RecurringItemForm'
import { EmptyCard } from '@/components/shared/EmptyCard'
import { MobilePageHeader } from '@/components/layout/MobilePageHeader'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  createRecurringItemAction,
  updateRecurringItemAction,
  toggleRecurringItemAction,
  deleteRecurringItemAction,
  registerRecurringNowAction,
} from '@/app/(dashboard)/recurring/actions'

interface Props {
  items: RecurringItemWithRelations[]
  accounts: AccountWithType[]
  categories: CategoryWithParent[]
  currency: string
  locale: string
}

const FREQ_LABEL: Record<string, string> = {
  daily: 'Diario', weekly: 'Semanal', biweekly: 'Quincenal',
  monthly: 'Mensual', bimonthly: 'Bimestral', quarterly: 'Trimestral', yearly: 'Anual',
}

const FREQ_ORDER: Record<string, number> = {
  daily: 0, weekly: 1, biweekly: 2, monthly: 3, bimonthly: 4, quarterly: 5, yearly: 6,
}

function urgencyBadge(nextDate: string | null): { label: string; className: string } | null {
  if (!nextDate) return null
  const days = differenceInDays(parseISO(nextDate), new Date())
  if (days <= 0)  return { label: 'Hoy', className: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' }
  if (days <= 7)  return { label: 'Esta semana', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' }
  if (days <= 31) return { label: 'Próximo mes', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' }
  return null
}

function formatCurrency(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}

export function RecurringClient({ items, accounts, categories, currency, locale }: Props) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<RecurringItemWithRelations | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Group by frequency
  const grouped = items.reduce<Record<string, RecurringItemWithRelations[]>>((acc, item) => {
    const key = item.frequency
    if (!acc[key]) acc[key] = []
    acc[key]!.push(item)
    return acc
  }, {})

  const sortedGroups = Object.entries(grouped).sort(
    ([a], [b]) => (FREQ_ORDER[a] ?? 99) - (FREQ_ORDER[b] ?? 99),
  )

  function handleCreate(values: RecurringItemInput) {
    startTransition(async () => {
      const res = await createRecurringItemAction(values)
      if (!res.ok) { toast.error(res.error); return }
      toast.success('Recurrente creado')
      setFormOpen(false)
      router.refresh()
    })
  }

  function handleUpdate(values: RecurringItemInput) {
    if (!editItem) return
    startTransition(async () => {
      const res = await updateRecurringItemAction(editItem.id, values)
      if (!res.ok) { toast.error(res.error); return }
      toast.success('Recurrente actualizado')
      setEditItem(null)
      router.refresh()
    })
  }

  function handleToggle(id: string, isActive: boolean) {
    startTransition(async () => {
      const res = await toggleRecurringItemAction(id, isActive)
      if (!res.ok) toast.error(res.error)
      else router.refresh()
    })
  }

  function handlePayNow(id: string) {
    startTransition(async () => {
      const res = await registerRecurringNowAction(id)
      if (!res.ok) { toast.error(res.error); return }
      toast.success('Pago registrado y próxima fecha actualizada')
        router.refresh()
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteRecurringItemAction(id)
      if (!res.ok) { toast.error(res.error); return }
      toast.success('Eliminado')
      setDeleteConfirm(null)
      router.refresh()
    })
  }

  // Mobile calculations
  const monthlyInflow = items.filter(i => i.transaction_type === 'income' && i.is_active).reduce((s, i) => s + i.amount, 0)
  const monthlyOutflow = items.filter(i => i.transaction_type === 'expense' && i.is_active).reduce((s, i) => s + i.amount, 0)
  const upcoming = items.filter(i => {
    if (!i.next_occurrence_date) return false
    const days = differenceInDays(parseISO(i.next_occurrence_date), new Date())
    return days <= 7
  })
  const later = items.filter(i => !upcoming.includes(i))

  const mobileHeader = (
    <MobilePageHeader
      title="Recurrentes"
      action={
        <button
          onClick={() => setFormOpen(true)}
          className="flex size-9 items-center justify-center rounded-full bg-foreground text-background"
          aria-label="Nuevo recurrente"
        >
          <Plus className="size-[18px]" strokeWidth={2} />
        </button>
      }
    />
  )

  if (items.length === 0) {
    return (
      <>
        {mobileHeader}
        <div className="px-4 pt-4 lg:p-0">
          <EmptyCard
            emoji="🔄"
            title="Sin recurrentes todavía"
            description="Registrá tus gastos fijos — alquiler, streaming, servicios — y la app te avisa antes de que venzan."
            ctaLabel="Agregar el primero"
            onCta={() => setFormOpen(true)}
          />
        </div>
        <RecurringItemForm open={formOpen} onOpenChange={setFormOpen} accounts={accounts} categories={categories} defaultCurrency={currency} onSubmit={handleCreate} isPending={isPending} />
      </>
    )
  }

  return (
    <div>
      {mobileHeader}

      {/* ── Mobile layout ── */}
      <div className="lg:hidden px-4 pt-4 pb-6 space-y-5">
        {/* 2-col summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-card p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Entra al mes</p>
            <p className="text-base font-bold tabular-nums" style={{ color: 'var(--success)' }}>+{formatCurrency(monthlyInflow, currency, locale)}</p>
            <p className="text-xs-plus text-muted-foreground mt-0.5">{items.filter(i => i.transaction_type === 'income').length} ingreso{items.filter(i => i.transaction_type === 'income').length !== 1 ? 's' : ''} fijo{items.filter(i => i.transaction_type === 'income').length !== 1 ? 's' : ''}</p>
          </div>
          <div className="rounded-xl border bg-card p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Sale al mes</p>
            <p className="text-base font-bold tabular-nums" style={{ color: 'var(--danger)' }}>−{formatCurrency(monthlyOutflow, currency, locale)}</p>
            <p className="text-xs-plus text-muted-foreground mt-0.5">{items.filter(i => i.transaction_type === 'expense').length} gasto{items.filter(i => i.transaction_type === 'expense').length !== 1 ? 's' : ''} fijo{items.filter(i => i.transaction_type === 'expense').length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Upcoming 7 days */}
        {upcoming.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Próximos 7 días</p>
            <div className="space-y-2">
              {upcoming.map((item) => {
                const badge = urgencyBadge(item.next_occurrence_date)
                const isExpense = item.transaction_type === 'expense'
                return (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl border bg-card px-3.5 py-3">
                    <span className="flex size-[38px] shrink-0 items-center justify-center rounded-[10px] bg-muted text-base">
                      {item.category?.icon ?? (isExpense ? '💸' : '💰')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold truncate">{item.description}</p>
                        {badge && <span className={cn('shrink-0 text-[9px] font-bold rounded-full px-1.5 py-0.5', badge.className)}>{badge.label}</span>}
                      </div>
                      <p className="text-xs-plus text-muted-foreground mt-0.5">{item.account?.name} · {item.next_occurrence_date ? format(parseISO(item.next_occurrence_date), 'd MMM', { locale: es }) : '—'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn('text-sm font-semibold tabular-nums', isExpense ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400')}>
                        {isExpense ? '−' : '+'}{formatCurrency(item.amount, item.currency_code ?? currency, locale)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{FREQ_LABEL[item.frequency] ?? item.frequency}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Later items */}
        {later.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Más adelante</p>
            <div className="space-y-2">
              {later.map((item) => {
                const isExpense = item.transaction_type === 'expense'
                return (
                  <div key={item.id} className={cn('flex items-center gap-3 rounded-xl border bg-card px-3.5 py-2.5', !item.is_active && 'opacity-50')}>
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm">
                      {item.category?.icon ?? (isExpense ? '💸' : '💰')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.description}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.next_occurrence_date ? format(parseISO(item.next_occurrence_date), 'd MMM', { locale: es }) : '—'} · {FREQ_LABEL[item.frequency] ?? item.frequency}
                      </p>
                    </div>
                    <p className={cn('text-sm font-semibold tabular-nums shrink-0', isExpense ? 'text-foreground' : 'text-emerald-600 dark:text-emerald-400')}>
                      {isExpense ? '−' : '+'}{formatCurrency(item.amount, item.currency_code ?? currency, locale)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden lg:block space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => setFormOpen(true)} size="sm" className="gap-1.5">
            <Plus className="size-4" /> Nuevo recurrente
          </Button>
        </div>
      {sortedGroups.map(([freq, freqItems]) => (
        <section key={freq}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {FREQ_LABEL[freq] ?? freq}
          </h2>
          <div className="space-y-2">
            {freqItems.map((item) => {
              const badge = urgencyBadge(item.next_occurrence_date)
              const isExpense = item.transaction_type === 'expense'
              return (
                <div key={item.id} className={cn(
                  'flex items-center gap-2 rounded-xl border bg-card px-3 py-2.5 shadow-sm transition-opacity',
                  !item.is_active && 'opacity-50',
                )}>
                  {/* Icon */}
                  <span className="size-8 shrink-0 flex items-center justify-center rounded-full bg-muted text-sm">
                    {item.category?.icon ?? (isExpense ? '💸' : '💰')}
                  </span>

                  {/* Description + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="text-sm font-medium truncate leading-tight">{item.description}</p>
                      {badge && (
                        <span className={cn('shrink-0 text-[9px] font-semibold rounded-full px-1.5 py-0.5 whitespace-nowrap', badge.className)}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {item.account?.name ?? '—'}
                      {item.next_occurrence_date && ` · ${format(parseISO(item.next_occurrence_date), 'd MMM', { locale: es })}`}
                    </p>
                  </div>

                  {/* Amount */}
                  <span className={cn(
                    'text-sm font-semibold tabular-nums shrink-0 whitespace-nowrap',
                    isExpense ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400',
                  )}>
                    {isExpense ? '-' : '+'}{formatCurrency(item.amount, item.currency_code ?? currency, locale)}
                  </span>

                  {/* Actions — single "···" menu keeps card width consistent on mobile */}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors focus:outline-none">
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      {item.is_active && (
                        <>
                          <DropdownMenuItem
                            onClick={() => handlePayNow(item.id)}
                            className="flex items-center gap-2"
                          >
                            <CreditCard className="size-3.5" />
                            Registrar pago
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem onClick={() => setEditItem(item)} className="flex items-center gap-2">
                        <Edit className="size-3.5" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggle(item.id, !item.is_active)}
                        className="flex items-center gap-2"
                      >
                        {item.is_active ? <PowerOff className="size-3.5" /> : <Power className="size-3.5" />}
                        {item.is_active ? 'Desactivar' : 'Activar'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {deleteConfirm === item.id ? (
                        <DropdownMenuItem
                          onClick={() => handleDelete(item.id)}
                          variant="destructive"
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="size-3.5" />
                          Confirmar eliminación
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => setDeleteConfirm(item.id)}
                          variant="destructive"
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="size-3.5" />
                          Eliminar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })}
          </div>
        </section>
      ))}

      </div>{/* end desktop */}

      <RecurringItemForm open={formOpen} onOpenChange={setFormOpen} accounts={accounts} categories={categories} defaultCurrency={currency} onSubmit={handleCreate} isPending={isPending} />
      <RecurringItemForm open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null) }} accounts={accounts} categories={categories} defaultCurrency={currency} item={editItem ?? undefined} onSubmit={handleUpdate} isPending={isPending} />
    </div>
  )
}
