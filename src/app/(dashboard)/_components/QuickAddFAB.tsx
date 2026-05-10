'use client'

import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

/**
 * Floating action button on the dashboard — navigates to Transactions
 * and opens the create form automatically via ?new=1 URL param.
 */
export function QuickAddFAB() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push('/transactions?new=1')}
      className="fixed bottom-20 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors lg:bottom-6"
      aria-label="Nueva transacción"
      title="Nueva transacción"
    >
      <Plus className="size-6" />
    </button>
  )
}
