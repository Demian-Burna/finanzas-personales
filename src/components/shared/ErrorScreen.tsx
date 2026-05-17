import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Action {
  label: string
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary'
}

interface ErrorScreenProps {
  icon: React.ReactNode
  title: string
  body: string
  actions: [Action, Action?]
  refCode?: string
  className?: string
}

export function ErrorScreen({ icon, title, body, actions, refCode, className }: ErrorScreenProps) {
  return (
    <div className={cn('flex min-h-screen flex-col items-center justify-center px-8 text-center', className)}>
      <div className="flex size-[72px] items-center justify-center rounded-[22px] bg-muted mb-7 text-4xl">
        {icon}
      </div>

      <h1 className="text-xl font-bold tracking-tight">{title}</h1>
      <p className="mt-3 text-sm text-muted-foreground max-w-xs leading-relaxed">{body}</p>

      <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
        {actions.filter(Boolean).map((action, i) => {
          if (!action) return null
          const isPrimary = i === 0
          const cls = isPrimary
            ? 'flex items-center justify-center h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors'
            : 'flex items-center justify-center h-12 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'

          if (action.href) {
            return <Link key={i} href={action.href} className={cls}>{action.label}</Link>
          }
          return (
            <button key={i} type="button" onClick={action.onClick} className={cls}>
              {action.label}
            </button>
          )
        })}
      </div>

      {refCode && (
        <p className="mt-8 text-[10px] font-mono text-muted-foreground/50">
          Código de referencia: {refCode}
        </p>
      )}
    </div>
  )
}
