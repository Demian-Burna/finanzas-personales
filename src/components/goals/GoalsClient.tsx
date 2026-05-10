'use client'

import { useState, useTransition } from 'react'
import { Plus, Target, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { SavingGoalWithContributions } from '@/lib/supabase/queries/saving-goals'
import type { AccountWithType } from '@/lib/supabase/queries/accounts'
import type { SavingGoalInput, GoalContributionInput } from '@/lib/validations/saving-goal'
import { GoalForm } from '@/components/forms/GoalForm'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { createGoalAction, updateGoalAction, addContributionAction, updateGoalStatusAction, createGoalTransactionAction, deleteGoalAction } from '@/app/(dashboard)/goals/actions'

interface Props {
  goals: SavingGoalWithContributions[]
  accounts: AccountWithType[]
  currency: string
  locale: string
}

function formatCurrency(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}


function GoalCard({ goal, currency, locale, onContribute, onEdit, onPause, onDelete }: {
  goal: SavingGoalWithContributions
  currency: string
  locale: string
  onContribute: (goal: SavingGoalWithContributions) => void
  onEdit: (goal: SavingGoalWithContributions) => void
  onPause: (id: string, status: 'active' | 'paused') => void
  onDelete: (id: string) => void
}) {
  const pct = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0
  const remaining = goal.target_amount - goal.current_amount
  const isCompleted = goal.status === 'completed'
  const isPaused = goal.status === 'paused'

  // Projection: average monthly contribution
  const contributions = goal.contributions ?? []
  let projectionMonths: number | null = null
  if (contributions.length >= 2 && !isCompleted && remaining > 0) {
    const totalContrib = contributions.reduce((s, c) => s + c.amount, 0)
    const firstDate = new Date(contributions[contributions.length - 1]!.contribution_date)
    const lastDate = new Date(contributions[0]!.contribution_date)
    const monthsDiff = Math.max(
      (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + (lastDate.getMonth() - firstDate.getMonth()),
      1,
    )
    const avgMonthly = totalContrib / monthsDiff
    if (avgMonthly > 0) projectionMonths = Math.ceil(remaining / avgMonthly)
  }

  // Chart data (last 12 contributions, cumulative)
  const chartData = [...contributions]
    .reverse()
    .slice(0, 12)
    .reduce<{ date: string; amount: number }[]>((acc, c) => {
      const prev = acc[acc.length - 1]?.amount ?? 0
      acc.push({ date: c.contribution_date, amount: prev + c.amount })
      return acc
    }, [])

  const goalCurrency = goal.currency_code ?? currency
  const barColor = isCompleted ? '#10b981' : pct >= 80 ? '#f59e0b' : '#6366f1'

  return (
    <div className={cn('rounded-xl border bg-card shadow-sm overflow-hidden', isPaused && 'opacity-60')}>
      {/* Progress bar stripe at top */}
      <div className="h-1 bg-muted">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${Math.min(pct, 100)}%`, background: barColor }}
        />
      </div>

      <div className="p-4 space-y-3">
        {/* Header row: icon + name + pct badge */}
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0 leading-none mt-0.5">{goal.icon ?? '🎯'}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-sm truncate leading-snug">{goal.name}</p>
              <span className={cn(
                'shrink-0 text-[10px] font-bold tabular-nums rounded-full px-2 py-0.5',
                isCompleted
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : pct >= 80
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                    : 'bg-primary/10 text-primary',
              )}>
                {isCompleted ? 'Cumplida ✓' : `${pct.toFixed(0)}%`}
              </span>
            </div>
            {goal.target_date && !isCompleted && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Objetivo: {new Date(goal.target_date + 'T00:00:00').toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>

        {/* Amount row */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-lg font-bold tabular-nums">
              {formatCurrency(goal.current_amount, goalCurrency, locale)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              de {formatCurrency(goal.target_amount, goalCurrency, locale)}
              {remaining > 0 && !isCompleted && ` · faltan ${formatCurrency(remaining, goalCurrency, locale)}`}
            </p>
          </div>
          {projectionMonths != null && (
            <p className="text-[10px] text-muted-foreground text-right">
              ~{projectionMonths} mes{projectionMonths !== 1 ? 'es' : ''}<br />
              <span>a este ritmo</span>
            </p>
          )}
        </div>

        {/* Mini chart */}
        {chartData.length > 1 && (
          <div className="h-16 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                <defs>
                  <linearGradient id={`grad-${goal.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={barColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={barColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis hide domain={[0, goal.target_amount]} />
                <Tooltip
                  formatter={(v) => [formatCurrency(Number(v ?? 0), goalCurrency, locale), 'Acumulado']}
                  contentStyle={{
                    fontSize: 11,
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--foreground)',
                  }}
                />
                <ReferenceLine y={goal.target_amount} stroke="#10b981" strokeDasharray="4 2" />
                <Area type="monotone" dataKey="amount" stroke={barColor} fill={`url(#grad-${goal.id})`} strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Actions */}
        {!isCompleted && (
          <div className="flex gap-2 pt-1 border-t">
            <Button size="sm" onClick={() => onContribute(goal)} className="flex-1 text-xs h-8 gap-1.5">
              + Agregar aporte
            </Button>
            <Button variant="outline" size="sm" onClick={() => onEdit(goal)} className="text-xs h-8">
              Editar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onPause(goal.id, isPaused ? 'active' : 'paused')} className="text-xs h-8">
              {isPaused ? 'Reanudar' : 'Pausar'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(goal.id)}
              className="text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              title="Eliminar meta"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function ContributeModal({ goal, accounts, currency, onClose, onSubmit, isPending }: {
  goal: SavingGoalWithContributions
  accounts: AccountWithType[]
  currency: string
  onClose: () => void
  onSubmit: (values: GoalContributionInput, accountId: string | null) => void
  isPending: boolean
}) {
  const goalCurrency = goal.currency_code ?? currency
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0] ?? '')
  const [accountId, setAccountId] = useState<string>('')

  const selectedAccount = accounts.find((a) => a.id === accountId)

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Agregar aporte — {goal.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Monto ({goalCurrency})</Label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Account — creates a transaction deducting from this account */}
          <div>
            <Label>Descontar de cuenta</Label>
            <Select value={accountId} onValueChange={(v) => setAccountId(v ?? '')}>
              <SelectTrigger className="mt-1 w-full">
                <SelectValue>
                  {selectedAccount ? selectedAccount.name : <span className="text-muted-foreground">Sin transacción</span>}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name} ({a.currency_code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {accountId
                ? 'Se creará un gasto en la cuenta seleccionada'
                : 'Opcional — si seleccionás una cuenta se crea un gasto automáticamente'}
            </p>
          </div>

          <div>
            <Label>Fecha</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Nota (opcional)</Label>
            <Input placeholder="Ej: Aguinaldo..." value={note} onChange={(e) => setNote(e.target.value)} className="mt-1" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button
              type="button"
              disabled={isPending || !amount || Number(amount) <= 0}
              onClick={() => onSubmit(
                { goal_id: goal.id, amount: Number(amount), contribution_date: date, note: note || null, transaction_id: null },
                accountId || null,
              )}
            >
              {isPending ? 'Guardando...' : 'Agregar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function GoalsClient({ goals, accounts, currency, locale }: Props) {
  const [formOpen, setFormOpen] = useState(false)
  const [editGoal, setEditGoal] = useState<SavingGoalWithContributions | null>(null)
  const [contributeGoal, setContributeGoal] = useState<SavingGoalWithContributions | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCreate(values: SavingGoalInput) {
    startTransition(async () => {
      const res = await createGoalAction(values)
      if (!res.ok) { toast.error(res.error); return }
      toast.success('Meta creada')
      setFormOpen(false)
    })
  }

  function handleUpdate(values: SavingGoalInput) {
    if (!editGoal) return
    startTransition(async () => {
      const res = await updateGoalAction(editGoal.id, values)
      if (!res.ok) { toast.error(res.error); return }
      toast.success('Meta actualizada')
      setEditGoal(null)
    })
  }

  function handleContribute(values: GoalContributionInput, accountId: string | null) {
    startTransition(async () => {
      // 1. Record the contribution and update goal progress
      const res = await addContributionAction(values)
      if (!res.ok) { toast.error(res.error); return }

      // 2. If an account was selected, create a matching expense transaction
      if (accountId) {
        const goal = goals.find((g) => g.id === values.goal_id)
        const txRes = await createGoalTransactionAction({
          account_id: accountId,
          currency_code: goal?.currency_code ?? currency,
          amount: values.amount,
          description: `Aporte: ${goal?.name ?? 'Meta de ahorro'}`,
          transaction_date: values.contribution_date,
          note: values.note ?? null,
        })
        if (!txRes.ok) {
          toast.warning('Aporte registrado, pero hubo un error al crear la transacción: ' + txRes.error)
        } else {
          toast.success('Aporte registrado y transacción creada')
        }
      } else {
        toast.success('Aporte registrado')
      }

      setContributeGoal(null)
    })
  }

  function handleDeleteGoal(id: string) {
    startTransition(async () => {
      const res = await deleteGoalAction(id)
      if (!res.ok) { toast.error(res.error); return }
      toast.success('Meta eliminada')
    })
  }

  function handlePause(id: string, status: 'active' | 'paused') {
    startTransition(async () => {
      const res = await updateGoalStatusAction(id, status)
      if (!res.ok) toast.error(res.error)
    })
  }

  const active = goals.filter((g) => g.status !== 'completed')
  const completed = goals.filter((g) => g.status === 'completed')

  return (
    <div className="space-y-6">
      {/* Always-visible new button on desktop */}
      {goals.length > 0 && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setFormOpen(true)} className="gap-1.5 hidden sm:inline-flex">
            <Plus className="size-4" />
            Nueva meta
          </Button>
        </div>
      )}

      {goals.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
          <Target className="size-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Todavía no tenés metas de ahorro.</p>
          <Button onClick={() => setFormOpen(true)} size="sm" className="mt-4 gap-1.5">
            <Plus className="size-4" /> Crear la primera
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((g) => (
              <GoalCard key={g.id} goal={g} currency={currency} locale={locale}
                onContribute={setContributeGoal} onEdit={setEditGoal} onPause={handlePause} onDelete={handleDeleteGoal} />
            ))}
          </div>
          {completed.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Cumplidas</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {completed.map((g) => (
                  <GoalCard key={g.id} goal={g} currency={currency} locale={locale}
                    onContribute={setContributeGoal} onEdit={setEditGoal} onPause={handlePause} onDelete={handleDeleteGoal} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* FAB */}
      <button onClick={() => setFormOpen(true)} className="fixed bottom-20 right-4 z-40 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg lg:hidden" aria-label="Nueva meta">
        <Plus className="size-5" />
      </button>

      <GoalForm open={formOpen} onOpenChange={setFormOpen} defaultCurrency={currency} onSubmit={handleCreate} isPending={isPending} />
      <GoalForm open={!!editGoal} onOpenChange={(o) => { if (!o) setEditGoal(null) }} defaultCurrency={currency} goal={editGoal ?? undefined} onSubmit={handleUpdate} isPending={isPending} />
      {contributeGoal && (
        <ContributeModal goal={contributeGoal} accounts={accounts} currency={currency} onClose={() => setContributeGoal(null)} onSubmit={handleContribute} isPending={isPending} />
      )}
    </div>
  )
}
