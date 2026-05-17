'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

interface Props {
  title: string
}

export function SettingsMobileBackHeader({ title }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  function goBack() {
    const next = new URLSearchParams(params.toString())
    next.delete('tab')
    router.push(`${pathname}?${next.toString()}`)
  }

  return (
    <div className="sticky top-0 z-30 flex items-center gap-1 border-b bg-background/95 px-2 py-2 backdrop-blur-sm lg:hidden">
      <button
        onClick={goBack}
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Volver"
      >
        <ChevronLeft className="size-5" strokeWidth={1.75} />
        <span>Configuración</span>
      </button>
      <span className="flex-1 text-center text-sm font-semibold pr-20">{title}</span>
    </div>
  )
}
