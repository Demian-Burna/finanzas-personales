'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog'
import { cn } from '@/lib/utils'

function useIsDesktop() {
  const [v, setV] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    setV(mq.matches)
    const h = (e: MediaQueryListEvent) => setV(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
  return v
}

interface FormShellProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  /** Rendered in the sheet header (right side) on mobile, and below content on desktop */
  primaryAction?: ReactNode
  children: ReactNode
  maxWidth?: string
}

export function FormShell({
  open,
  onOpenChange,
  title,
  primaryAction,
  children,
  maxWidth = 'max-w-lg',
}: FormShellProps) {
  const isDesktop = useIsDesktop()

  // Prevent body scroll when mobile sheet is open
  useEffect(() => {
    if (!isDesktop && open) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [open, isDesktop])

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={maxWidth}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {children}
            {primaryAction && (
              <div className="flex justify-end pt-2">{primaryAction}</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Mobile bottom sheet
  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={() => onOpenChange(false)}
        aria-hidden
      />

      {/* Sheet panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl bg-background',
          'max-h-[calc(100dvh-56px)] transition-transform duration-300 ease-out',
          open ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        {/* Drag handle */}
        <div className="flex shrink-0 justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Sticky header */}
        <div className="flex shrink-0 items-center gap-3 border-b px-4 py-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
          <span className="flex-1 text-base font-semibold">{title}</span>
          {primaryAction}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 pb-[env(safe-area-inset-bottom,1rem)]">
          {children}
        </div>
      </div>
    </>
  )
}
