'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { savingGoalSchema, type SavingGoalInput } from '@/lib/validations/saving-goal'
import type { SavingGoalWithContributions } from '@/lib/supabase/queries/saving-goals'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const EMOJI_OPTIONS = ['🎯','🏠','🚗','✈️','💻','📱','🎓','💍','🏖️','🛒','🏋️','🎸','🐶','🌱','💰','🏦','🎁','🚀']

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultCurrency?: string
  goal?: SavingGoalWithContributions
  onSubmit: (values: SavingGoalInput) => void
  isPending?: boolean
}

export function GoalForm({ open, onOpenChange, defaultCurrency = 'ARS', goal, onSubmit, isPending }: Props) {
  const isEdit = !!goal
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const form = useForm<SavingGoalInput>({
    resolver: zodResolver(savingGoalSchema) as Resolver<SavingGoalInput>,
    defaultValues: {
      name: '', description: '', currency_code: defaultCurrency,
      target_amount: 0, target_date: null, icon: '🎯', color: null, account_id: null,
    },
  })

  const selectedIcon = form.watch('icon')

  useEffect(() => {
    if (goal) {
      form.reset({
        name: goal.name, description: goal.description ?? '',
        currency_code: goal.currency_code, target_amount: goal.target_amount,
        target_date: goal.target_date ?? null, icon: goal.icon ?? '🎯',
        color: goal.color ?? null, account_id: goal.account_id ?? null,
      })
    } else {
      form.reset({ name: '', description: '', currency_code: defaultCurrency, target_amount: 0, target_date: null, icon: '🎯', color: null, account_id: null })
    }
  }, [goal, form, defaultCurrency])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar meta' : 'Nueva meta'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Emoji picker */}
          <div>
            <Label>Ícono</Label>
            <div className="mt-1 flex items-center gap-2">
              <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="flex size-10 items-center justify-center rounded-lg border text-2xl hover:bg-muted transition-colors">
                {selectedIcon ?? '🎯'}
              </button>
              <span className="text-xs text-muted-foreground">Hacé clic para cambiar</span>
            </div>
            {showEmojiPicker && (
              <div className="mt-2 grid grid-cols-9 gap-1 rounded-lg border p-2">
                {EMOJI_OPTIONS.map((e) => (
                  <button key={e} type="button"
                    onClick={() => { form.setValue('icon', e); setShowEmojiPicker(false) }}
                    className={`flex size-8 items-center justify-center rounded text-lg hover:bg-muted transition-colors ${selectedIcon === e ? 'bg-primary/10 ring-1 ring-primary' : ''}`}>
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="goal-name">Nombre</Label>
            <Input id="goal-name" placeholder="Ej: Viaje a Europa" {...form.register('name')} className="mt-1" />
            {form.formState.errors.name && <p className="mt-1 text-xs text-destructive">{form.formState.errors.name.message}</p>}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="goal-desc">Descripción (opcional)</Label>
            <Input id="goal-desc" placeholder="Detalles de la meta..." {...form.register('description')} className="mt-1" />
          </div>

          {/* Amount + currency */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Monto objetivo</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00" {...form.register('target_amount', { valueAsNumber: true })} className="mt-1" />
              {form.formState.errors.target_amount && <p className="mt-1 text-xs text-destructive">{form.formState.errors.target_amount.message}</p>}
            </div>
            <div className="w-24">
              <Label>Moneda</Label>
              <Input placeholder="ARS" {...form.register('currency_code')} className="mt-1 uppercase" maxLength={3} />
            </div>
          </div>

          {/* Target date */}
          <div>
            <Label>Fecha objetivo (opcional)</Label>
            <Input type="date" {...form.register('target_date')} className="mt-1" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>{isPending ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear meta'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
