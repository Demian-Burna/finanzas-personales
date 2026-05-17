import Link from 'next/link'
import { cn } from '@/lib/utils'

interface EmptyCardProps {
  emoji: string
  title: string
  description: string
  ctaLabel?: string
  onCta?: () => void
  secondaryLabel?: string
  secondaryHref?: string
  className?: string
}

export function EmptyCard({
  emoji,
  title,
  description,
  ctaLabel,
  onCta,
  secondaryLabel,
  secondaryHref,
  className,
}: EmptyCardProps) {
  return (
    <div className={cn('flex flex-col items-center rounded-2xl border bg-card px-8 py-14 text-center', className)}>
      <span className="text-5xl leading-none mb-5" role="img" aria-hidden>
        {emoji}
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1.5 text-xs-plus text-muted-foreground max-w-xs leading-relaxed">{description}</p>

      {ctaLabel && onCta && (
        <button
          type="button"
          onClick={onCta}
          className="mt-6 inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {ctaLabel}
        </button>
      )}

      {secondaryLabel && secondaryHref && (
        <Link
          href={secondaryHref}
          className="mt-3 text-xs-plus text-muted-foreground underline-offset-2 hover:underline hover:text-foreground transition-colors"
        >
          {secondaryLabel}
        </Link>
      )}
    </div>
  )
}
