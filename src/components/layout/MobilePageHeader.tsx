'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  title: string
  action?: ReactNode
}

export function MobilePageHeader({ title, action }: Props) {
  const router = useRouter()

  return (
    <header
      className="lg:hidden sticky top-0 z-30 flex items-center gap-1 border-b px-2"
      style={{ background: 'var(--background)', paddingTop: 6, paddingBottom: 10 }}
    >
      <button
        onClick={() => router.back()}
        className="flex size-10 items-center justify-center text-foreground"
        aria-label="Volver"
      >
        <ChevronLeft className="size-[22px]" strokeWidth={1.75} />
      </button>
      <div className="flex-1 text-center text-base font-semibold" style={{ letterSpacing: '-0.005em' }}>
        {title}
      </div>
      <div className="flex min-w-[40px] items-center justify-end pr-1.5">
        {action}
      </div>
    </header>
  )
}
