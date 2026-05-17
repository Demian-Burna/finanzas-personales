'use client'

import { useState, useEffect } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Consequence {
  icon: string
  title: string
  body: string
}

interface ConfirmModalProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  body: string
  destructive?: boolean
  isPending?: boolean
  // Variants
  variant?: 'simple' | 'detailed' | 'type-to-confirm' | 'inline'
  // detailed only
  consequences?: Consequence[]
  archiveOption?: { label: string; onArchive: () => void }
  // type-to-confirm only
  confirmWord?: string
  // button labels
  confirmLabel?: string
  cancelLabel?: string
}

export function ConfirmModal({
  open,
  onConfirm,
  onCancel,
  title,
  body,
  destructive = false,
  isPending = false,
  variant = 'simple',
  consequences,
  archiveOption,
  confirmWord = 'ELIMINAR',
  confirmLabel,
  cancelLabel = 'Cancelar',
}: ConfirmModalProps) {
  const [typed, setTyped] = useState('')

  useEffect(() => { if (!open) setTyped('') }, [open])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const defaultConfirmLabel = confirmLabel ?? (destructive ? 'Eliminar' : 'Confirmar')
  const canConfirm = variant === 'type-to-confirm' ? typed === confirmWord : true

  const destructiveBtn = cn(
    'flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors',
    destructive
      ? 'bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50'
      : 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50',
  )
  const cancelBtn = 'flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]"
        onClick={onCancel}
        aria-hidden
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal
        className="fixed inset-x-4 top-1/2 z-50 -translate-y-1/2 rounded-[18px] bg-background p-5 shadow-2xl"
        style={{ width: '100%', maxWidth: '400px', left: '50%', transform: 'translate(-50%, -50%)' }}
      >
        {/* inline variant: compact horizontal */}
        {variant === 'inline' && (
          <>
            <p className="text-sm font-semibold text-center mb-1">{title}</p>
            <p className="text-xs-plus text-muted-foreground text-center mb-5">{body}</p>
            <div className="flex gap-3">
              <button type="button" onClick={onCancel} className={cn(cancelBtn, 'flex-1')}>
                {cancelLabel}
              </button>
              <button type="button" onClick={onConfirm} disabled={isPending} className={cn(destructiveBtn, 'flex-1')}>
                {isPending ? 'Procesando...' : defaultConfirmLabel}
              </button>
            </div>
          </>
        )}

        {/* simple variant */}
        {variant === 'simple' && (
          <>
            {destructive && (
              <div className="flex justify-center mb-4">
                <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="size-6 text-destructive" />
                </span>
              </div>
            )}
            <p className="text-base font-semibold text-center">{title}</p>
            <p className="mt-2 text-xs-plus text-muted-foreground text-center leading-relaxed">{body}</p>
            <div className="mt-5 flex flex-col gap-2">
              <button type="button" onClick={onConfirm} disabled={isPending} className={destructiveBtn}>
                {isPending ? 'Procesando...' : defaultConfirmLabel}
              </button>
              <button type="button" onClick={onCancel} className={cancelBtn}>
                {cancelLabel}
              </button>
            </div>
          </>
        )}

        {/* detailed variant */}
        {variant === 'detailed' && (
          <>
            <div className="flex items-start gap-3 mb-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 mt-0.5">
                <AlertTriangle className="size-5 text-destructive" />
              </span>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-0.5 text-xs-plus text-muted-foreground">{body}</p>
              </div>
              <button type="button" onClick={onCancel} className="ml-auto text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
            {consequences && consequences.length > 0 && (
              <div className="mb-4 space-y-2 rounded-xl bg-muted/40 p-3">
                {consequences.map((c, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-base shrink-0">{c.icon}</span>
                    <div>
                      <p className="text-xs font-semibold">{c.title}</p>
                      <p className="text-[10px] text-muted-foreground">{c.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <button type="button" onClick={onConfirm} disabled={isPending} className={destructiveBtn}>
                {isPending ? 'Procesando...' : defaultConfirmLabel}
              </button>
              {archiveOption && (
                <button type="button" onClick={archiveOption.onArchive} className={cn(cancelBtn, 'border')}>
                  {archiveOption.label}
                </button>
              )}
              <button type="button" onClick={onCancel} className={cancelBtn}>
                {cancelLabel}
              </button>
            </div>
          </>
        )}

        {/* type-to-confirm variant */}
        {variant === 'type-to-confirm' && (
          <>
            {destructive && (
              <div className="flex justify-center mb-4">
                <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="size-6 text-destructive" />
                </span>
              </div>
            )}
            <p className="text-base font-semibold text-center">{title}</p>
            <p className="mt-2 text-xs-plus text-muted-foreground text-center leading-relaxed">{body}</p>
            <div className="mt-4">
              <p className="mb-1.5 text-xs text-muted-foreground text-center">
                Escribí <span className="font-mono font-bold text-foreground">{confirmWord}</span> para confirmar
              </p>
              <input
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={confirmWord}
                className="w-full rounded-xl border bg-muted/40 px-3 py-2.5 text-center font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                autoComplete="off"
              />
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={onConfirm}
                disabled={!canConfirm || isPending}
                className={cn(destructiveBtn, !canConfirm && 'opacity-40 cursor-not-allowed')}
              >
                {isPending ? 'Eliminando...' : defaultConfirmLabel}
              </button>
              <button type="button" onClick={onCancel} className={cancelBtn}>
                {cancelLabel}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
