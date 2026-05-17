'use client'

import { useState, useTransition } from 'react'
import { Plus, Edit, Trash2, ChevronRight, ChevronDown, Lock, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import type { CategoryWithParent } from '@/lib/supabase/queries/categories'
import { categorySchema, type CategoryInput } from '@/lib/validations/category'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormShell } from '@/components/ui/form-shell'
import { cn } from '@/lib/utils'
import { createCategoryAction, updateCategoryAction, deleteCategoryAction } from '@/app/(dashboard)/settings/actions'

const PRESET_COLORS = [
  '#ef4444','#f97316','#f59e0b','#eab308',
  '#84cc16','#22c55e','#10b981','#14b8a6',
  '#06b6d4','#3b82f6','#6366f1','#8b5cf6',
  '#a855f7','#ec4899','#f43f5e','#6b7280',
]

const COMMON_ICONS = ['🛒','🍽️','🚗','🏠','💊','📚','🎮','✈️','💻','👕','💆','🎸','🐾','💰','🏋️','🎁']

const TYPE_LABELS: Record<string, string> = { income: 'Ingreso', expense: 'Gasto', transfer: 'Transferencia' }

interface Props {
  categories: CategoryWithParent[]
}

function CategoryForm({ category, categories, onSubmit, onClose, isPending }: {
  category?: CategoryWithParent
  categories: CategoryWithParent[]
  onSubmit: (v: CategoryInput) => void
  onClose: () => void
  isPending: boolean
}) {
  const isEdit = !!category
  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema) as Resolver<CategoryInput>,
    defaultValues: {
      name: category?.name ?? '',
      transaction_type: (category?.transaction_type as CategoryInput['transaction_type']) ?? 'expense',
      parent_id: category?.parent_id ?? null,
      color: category?.color ?? '#6366f1',
      icon: category?.icon ?? null,
      sort_order: category?.sort_order ?? 0,
    },
  })

  const selectedColor = form.watch('color')
  const selectedIcon = form.watch('icon')

  const parents = categories.filter((c) => !c.parent_id && c.id !== category?.id)

  return (
    <FormShell
      open
      onOpenChange={(o) => { if (!o) onClose() }}
      title={isEdit ? 'Editar categoría' : 'Nueva categoría'}
      maxWidth="max-w-md"
      primaryAction={
        <Button size="sm" type="button" disabled={isPending} onClick={() => void form.handleSubmit(onSubmit)()}>
          {isPending ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear'}
        </Button>
      }
    >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input {...form.register('name')} className="mt-1" placeholder="Ej: Supermercado" />
            {form.formState.errors.name && <p className="mt-1 text-xs text-destructive">{form.formState.errors.name.message}</p>}
          </div>

          <div>
            <Label>Tipo</Label>
            <Controller control={form.control} name="transaction_type" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
          </div>

          <div>
            <Label>Categoría padre (opcional)</Label>
            <Controller control={form.control} name="parent_id" render={({ field }) => (
              <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || null)}>
                <SelectTrigger className="mt-1 w-full"><SelectValue placeholder="Sin padre (categoría raíz)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin padre</SelectItem>
                  {parents.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
          </div>

          {/* Color picker */}
          <div>
            <Label>Color</Label>
            <div className="mt-1 grid grid-cols-8 gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => form.setValue('color', c)}
                  className={cn('size-7 rounded-md border-2 transition-transform hover:scale-110', selectedColor === c ? 'border-foreground scale-110' : 'border-transparent')}
                  style={{ background: c }} />
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input type="color" value={selectedColor ?? '#6366f1'} onChange={(e) => form.setValue('color', e.target.value)}
                className="size-7 cursor-pointer rounded border" />
              <Input {...form.register('color')} className="h-7 w-28 font-mono text-xs" placeholder="#6366f1" />
            </div>
          </div>

          {/* Icon picker */}
          <div>
            <Label>Ícono (emoji)</Label>
            <div className="mt-1 grid grid-cols-8 gap-1">
              {COMMON_ICONS.map((e) => (
                <button key={e} type="button" onClick={() => form.setValue('icon', e)}
                  className={cn('size-8 rounded text-lg hover:bg-muted transition-colors', selectedIcon === e && 'bg-primary/10 ring-1 ring-primary')}>
                  {e}
                </button>
              ))}
            </div>
            <Input {...form.register('icon')} className="mt-1 w-24" placeholder="o escribí" maxLength={4} />
          </div>

        </form>
    </FormShell>
  )
}

function CategoryRow({ category, subCategories, onEdit, onDelete }: {
  category: CategoryWithParent
  subCategories?: CategoryWithParent[]
  onEdit: (c: CategoryWithParent) => void
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const hasChildren = (subCategories?.length ?? 0) > 0

  return (
    <div>
      <div className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted/40 transition-colors">
        <button type="button" onClick={() => setExpanded(!expanded)} className={cn('size-5 flex items-center justify-center text-muted-foreground', !hasChildren && 'invisible')}>
          {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </button>
        {category.color && <span className="size-2.5 rounded-full shrink-0" style={{ background: category.color }} />}
        <span className="text-sm">{category.icon ?? ''} {category.name}</span>
        <span className="text-[10px] text-muted-foreground ml-1">{TYPE_LABELS[category.transaction_type ?? ''] ?? ''}</span>

        {category.is_system ? (
          <span title="Categoría del sistema" className="ml-auto shrink-0"><Lock className="size-3 text-muted-foreground" /></span>
        ) : (
          <div className="ml-auto flex gap-1 shrink-0">
            <button onClick={() => onEdit(category)} className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted transition-colors"><Edit className="size-3" /></button>
            <button onClick={() => onDelete(category.id)} className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted transition-colors"><Trash2 className="size-3" /></button>
          </div>
        )}
      </div>

      {expanded && hasChildren && (
        <div className="ml-7 border-l pl-3 space-y-0.5">
          {subCategories!.map((child) => (
            <CategoryRow key={child.id} category={child} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

export function CategoriesTab({ categories }: Props) {
  const [formOpen, setFormOpen] = useState(false)
  const [editCat, setEditCat] = useState<CategoryWithParent | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const roots = categories.filter((c) => !c.parent_id)
  const childrenOf = (parentId: string) => categories.filter((c) => c.parent_id === parentId)

  function handleCreate(values: CategoryInput) {
    startTransition(async () => {
      const res = await createCategoryAction(values)
      if (!res.ok) { toast.error(res.error); return }
      toast.success('Categoría creada')
      setFormOpen(false)
    })
  }

  function handleUpdate(values: CategoryInput) {
    if (!editCat) return
    startTransition(async () => {
      const res = await updateCategoryAction(editCat.id, values)
      if (!res.ok) { toast.error(res.error); return }
      toast.success('Categoría actualizada')
      setEditCat(null)
    })
  }

  function handleDelete(id: string) {
    if (deleteConfirm !== id) { setDeleteConfirm(id); return }
    startTransition(async () => {
      const res = await deleteCategoryAction(id)
      if (!res.ok) { toast.error(res.error); return }
      toast.success('Categoría eliminada')
      setDeleteConfirm(null)
    })
  }

  const [mobileType, setMobileType] = useState<'expense' | 'income' | 'transfer'>('expense')
  const mobileRoots = roots.filter(c => c.transaction_type === mobileType || c.transaction_type === null)

  return (
    <div className="max-w-2xl">
      {/* ── Mobile layout ── */}
      <div className="lg:hidden px-4 pt-2 pb-6 space-y-4">
        {/* Segmented control */}
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 4, padding: 4, background: 'oklch(0.96 0 0)', borderRadius: 10 }}>
          {(['expense', 'income', 'transfer'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setMobileType(t)}
              className="rounded-lg py-2 text-[12.5px] font-medium transition-colors"
              style={{
                background: mobileType === t ? 'var(--background)' : 'transparent',
                boxShadow: mobileType === t ? '0 1px 3px oklch(0 0 0 / 0.08)' : 'none',
                color: mobileType === t ? 'var(--foreground)' : 'var(--muted-foreground)',
              }}
            >
              {t === 'expense' ? 'Gastos' : t === 'income' ? 'Ingresos' : 'Transfer.'}
            </button>
          ))}
        </div>

        <p className="text-xs-plus text-muted-foreground px-0.5">Las categorías del sistema (🔒) no se pueden eliminar pero sí renombrar o reasignar ícono.</p>

        {/* Category cards */}
        <div className="space-y-2">
          {mobileRoots.map((cat) => {
            const kids = childrenOf(cat.id)
            return (
              <div key={cat.id} className="rounded-xl border bg-card px-3.5 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-muted text-base">{cat.icon ?? '•'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold">{cat.name}</span>
                      {cat.is_system && <span className="text-[10px] text-muted-foreground">🔒</span>}
                    </div>
                    <p className="text-xs-plus text-muted-foreground">{kids.length > 0 ? `${kids.length} subcategoría${kids.length !== 1 ? 's' : ''}` : 'Sin subcategorías'}</p>
                  </div>
                  {!cat.is_system && (
                    <button onClick={() => setEditCat(cat)} className="flex size-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                      <MoreHorizontal className="size-4" />
                    </button>
                  )}
                </div>
                {kids.length > 0 && (
                  <div className="mt-2.5 pl-12 flex flex-wrap gap-1.5">
                    {kids.slice(0, 3).map((k) => (
                      <span key={k.id} className="rounded-full bg-muted px-2.5 py-1 text-[11.5px] text-muted-foreground">{k.name}</span>
                    ))}
                    {kids.length > 3 && (
                      <span className="rounded-full bg-muted px-2.5 py-1 text-[11.5px] text-muted-foreground">+{kids.length - 3} Sub</span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Add button */}
        <button onClick={() => setFormOpen(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl py-3.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          style={{ border: '1.5px dashed var(--border)' }}
        >
          <Plus className="size-4" strokeWidth={1.75} /> Nueva categoría
        </button>
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden lg:block space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Las categorías con 🔒 son del sistema y no se pueden editar.</p>
          <Button size="sm" onClick={() => setFormOpen(true)} className="gap-1.5 shrink-0">
            <Plus className="size-4" /> Nueva
          </Button>
        </div>
        <div className="rounded-xl border bg-card p-3 space-y-0.5">
          {roots.map((cat) => (
            <CategoryRow key={cat.id} category={cat} subCategories={childrenOf(cat.id)} onEdit={setEditCat} onDelete={handleDelete} />
          ))}
        </div>
      </div>

      {formOpen && (
        <CategoryForm categories={categories} onSubmit={handleCreate} onClose={() => setFormOpen(false)} isPending={isPending} />
      )}
      {editCat && (
        <CategoryForm category={editCat} categories={categories} onSubmit={handleUpdate} onClose={() => setEditCat(null)} isPending={isPending} />
      )}
    </div>
  )
}
