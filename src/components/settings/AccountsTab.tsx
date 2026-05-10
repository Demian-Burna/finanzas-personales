'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Edit, Archive } from 'lucide-react'
import { toast } from 'sonner'
import { useForm, Controller } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import type { AccountWithType } from '@/lib/supabase/queries/accounts'
import { accountSchema, type AccountInput } from '@/lib/validations/account'

// Custom resolver — same pattern as TransactionForm to bypass zodResolver/Zod v4 incompatibility
const accountResolver: Resolver<AccountInput> = async (values) => {
  const result = accountSchema.safeParse(values)
  if (result.success) return { values: result.data, errors: {} }
  const errors: Record<string, { type: string; message: string }> = {}
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || 'root'
    if (!errors[key]) errors[key] = { type: 'validation', message: issue.message }
  }
  return { values: {}, errors }
}
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CurrencySelect } from '@/components/shared/CurrencySelect'
import { cn } from '@/lib/utils'
import {
  createAccountAction, updateAccountAction,
  reorderAccountsAction, archiveAccountAction,
} from '@/app/(dashboard)/settings/actions'

interface AccountType { id: string; name: string; nature: string; icon: string | null }

interface Props {
  accounts: AccountWithType[]
  accountTypes: AccountType[]
  currency: string
}

// Spanish labels for DB account type names
const TYPE_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  checking: 'Cuenta corriente / Caja de ahorro',
  credit_card: 'Tarjeta de crédito',
  investment: 'Inversión',
  loan: 'Préstamo / Deuda',
  savings: 'Ahorro',
}


function SortableRow({ account, onEdit, onArchive }: {
  account: AccountWithType
  onEdit: (a: AccountWithType) => void
  onArchive: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: account.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const typeName = TYPE_LABELS[account.account_type?.name ?? ''] ?? account.account_type?.name ?? '—'

  return (
    <div ref={setNodeRef} style={style}
      className={cn('flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm', isDragging && 'opacity-50 ring-2 ring-primary')}>
      <button {...attributes} {...listeners} className="cursor-grab touch-none text-muted-foreground hover:text-foreground">
        <GripVertical className="size-4" />
      </button>
      <span className="flex size-8 items-center justify-center rounded-full text-sm" style={{ background: account.color ?? 'hsl(var(--muted))' }}>
        {account.icon ?? account.account_type?.icon ?? '🏦'}
      </span>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">{account.name}</p>
        <p className="text-xs text-muted-foreground">{typeName} · {account.currency_code}</p>
      </div>
      <p className="text-sm font-semibold tabular-nums shrink-0">
        {new Intl.NumberFormat('es-AR', { style: 'currency', currency: account.currency_code, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(account.current_balance)}
      </p>
      <div className="flex gap-1">
        <button onClick={() => onEdit(account)} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"><Edit className="size-3.5" /></button>
        <button onClick={() => onArchive(account.id)} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors" title="Archivar"><Archive className="size-3.5" /></button>
      </div>
    </div>
  )
}

function AccountForm({ account, accountTypes, defaultCurrency, onSubmit, onClose, isPending }: {
  account?: AccountWithType
  accountTypes: AccountType[]
  defaultCurrency: string
  onSubmit: (v: AccountInput) => void
  onClose: () => void
  isPending: boolean
}) {
  const isEdit = !!account

  const form = useForm<AccountInput>({
    resolver: accountResolver,
    defaultValues: {
      account_type_id: account?.account_type_id ?? '',
      currency_code: account?.currency_code ?? defaultCurrency,
      name: account?.name ?? '',
      description: account?.description ?? '',
      initial_balance: account?.initial_balance ?? 0,
      color: account?.color ?? '#6366f1',
      icon: null, // icon comes from account_type, not set manually
      include_in_net_worth: account?.include_in_net_worth ?? true,
      sort_order: account?.sort_order ?? 0,
    },
  })

  const selectedTypeId = form.watch('account_type_id')
  const selectedTypeName = (() => {
    const t = accountTypes.find((x) => x.id === selectedTypeId)
    if (!t) return undefined
    return TYPE_LABELS[t.name] ?? t.name
  })()

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {/* Show account type emoji next to title */}
            {selectedTypeId && (
              <span className="text-xl">
                {accountTypes.find((t) => t.id === selectedTypeId)?.icon ?? '🏦'}
              </span>
            )}
            {isEdit ? 'Editar cuenta' : 'Nueva cuenta'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* Name */}
          <div>
            <Label>Nombre</Label>
            <Input {...form.register('name')} className="mt-1" placeholder="Ej: Banco Galicia" />
            {form.formState.errors.name && <p className="mt-1 text-xs text-destructive">{form.formState.errors.name.message}</p>}
          </div>

          {/* Account type */}
          <div>
            <Label>Tipo de cuenta</Label>
            <Controller control={form.control} name="account_type_id" render={({ field }) => (
              <Select value={field.value} onValueChange={(v) => field.onChange(v ?? '')}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Seleccioná el tipo">
                    {selectedTypeName
                      ? `${accountTypes.find((t) => t.id === field.value)?.icon ?? ''} ${selectedTypeName}`
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {accountTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.icon ?? ''} {TYPE_LABELS[t.name] ?? t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
            {form.formState.errors.account_type_id && (
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.account_type_id.message}</p>
            )}
          </div>

          {/* Balance + currency */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Saldo inicial</Label>
              <Controller control={form.control} name="initial_balance" render={({ field }) => (
                <Input
                  type="text" inputMode="decimal" placeholder="0.00"
                  value={field.value === 0 ? '' : String(field.value)}
                  onChange={(e) => {
                    const n = parseFloat(e.target.value.replace(',', '.'))
                    field.onChange(isNaN(n) ? 0 : n)
                  }}
                  onBlur={field.onBlur}
                  className="mt-1"
                />
              )} />
            </div>
            <div className="w-36">
              <Label>Moneda</Label>
              <Controller control={form.control} name="currency_code" render={({ field }) => (
                <CurrencySelect value={field.value} onValueChange={field.onChange} className="mt-1 w-full" />
              )} />
            </div>
          </div>

          {/* Color — circle preview + color picker */}
          <div>
            <Label>Color de identificación</Label>
            <div className="mt-1 flex items-center gap-3">
              {/* Live preview circle — shows exactly how the account avatar will look */}
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-full text-lg shadow-sm ring-1 ring-border"
                style={{ background: form.watch('color') ?? '#6366f1' }}
              >
                {accountTypes.find((t) => t.id === selectedTypeId)?.icon ?? '🏦'}
              </span>
              {/* Color picker + hex input */}
              <input
                type="color"
                {...form.register('color')}
                className="h-9 w-10 shrink-0 cursor-pointer rounded-md border p-0.5"
              />
              <Input
                value={form.watch('color') ?? '#6366f1'}
                onChange={(e) => form.setValue('color', e.target.value)}
                placeholder="#6366f1"
                className="font-mono flex-1"
                maxLength={7}
              />
            </div>
          </div>

          {/* Net worth toggle */}
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Incluir en patrimonio neto</p>
              <p className="text-xs text-muted-foreground">Afecta el cálculo del patrimonio</p>
            </div>
            <Controller control={form.control} name="include_in_net_worth" render={({ field }) => (
              <button type="button" role="switch" aria-checked={field.value ?? true}
                onClick={() => field.onChange(!(field.value ?? true))}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${(field.value ?? true) ? 'bg-primary' : 'bg-muted'}`}>
                <span className={`inline-block size-3.5 rounded-full bg-white shadow transition-transform ${(field.value ?? true) ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            )} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            {/* Use onClick+handleSubmit instead of type="submit" to bypass Dialog form interception */}
            <Button
              type="button"
              disabled={isPending}
              onClick={() => void form.handleSubmit(onSubmit)()}
            >
              {isPending ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AccountsTab({ accounts: initialAccounts, accountTypes, currency }: Props) {
  const router = useRouter()
  const [accounts, setAccounts] = useState(initialAccounts)
  const [formOpen, setFormOpen] = useState(false)
  const [editAccount, setEditAccount] = useState<AccountWithType | null>(null)
  const [isPending, startTransition] = useTransition()

  // Sync local state whenever the server re-fetches (after router.refresh())
  useEffect(() => {
    setAccounts(initialAccounts)
  }, [initialAccounts])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = accounts.findIndex((a) => a.id === active.id)
    const newIndex = accounts.findIndex((a) => a.id === over.id)
    const reordered = arrayMove(accounts, oldIndex, newIndex)
    setAccounts(reordered)
    startTransition(async () => { await reorderAccountsAction(reordered.map((a) => a.id)) })
  }

  function handleCreate(values: AccountInput) {
    startTransition(async () => {
      const res = await createAccountAction(values)
      if (!res.ok) { toast.error(res.error); return }
      toast.success('Cuenta creada')
      setFormOpen(false)
      router.refresh() // re-fetches server data → useEffect syncs local state
    })
  }

  function handleUpdate(values: AccountInput) {
    if (!editAccount) return
    startTransition(async () => {
      const res = await updateAccountAction(editAccount.id, values)
      if (!res.ok) { toast.error(res.error); return }
      toast.success('Cuenta actualizada')
      setEditAccount(null)
      router.refresh() // re-fetches server data → useEffect syncs local state
    })
  }

  function handleArchive(id: string) {
    startTransition(async () => {
      const res = await archiveAccountAction(id)
      if (!res.ok) { toast.error(res.error); return }
      setAccounts((prev) => prev.filter((a) => a.id !== id))
      toast.success('Cuenta archivada')
      router.refresh()
    })
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto lg:mx-0">
      {/* Desktop: button in header. Mobile: FAB */}
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setFormOpen(true)} className="gap-1.5 hidden sm:inline-flex">
          <Plus className="size-4" /> Nueva cuenta
        </Button>
      </div>
      <button
        onClick={() => setFormOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg lg:hidden"
        aria-label="Nueva cuenta"
      >
        <Plus className="size-5" />
      </button>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={accounts.map((a) => a.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {accounts.map((a) => (
              <SortableRow key={a.id} account={a} onEdit={setEditAccount} onArchive={handleArchive} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {accounts.length === 0 && (
        <p className="text-sm text-center text-muted-foreground py-8">No hay cuentas activas.</p>
      )}

      {formOpen && (
        <AccountForm accountTypes={accountTypes} defaultCurrency={currency}
          onSubmit={handleCreate} onClose={() => setFormOpen(false)} isPending={isPending} />
      )}
      {editAccount && (
        <AccountForm account={editAccount} accountTypes={accountTypes} defaultCurrency={currency}
          onSubmit={handleUpdate} onClose={() => setEditAccount(null)} isPending={isPending} />
      )}
    </div>
  )
}
