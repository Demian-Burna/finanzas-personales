'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getTransactions } from '@/lib/supabase/queries/transactions'
import type { TransactionFilters, TransactionWithRelations } from '@/lib/supabase/queries/transactions'

const PAGE_SIZE = 30

export function useTransactions(
  filters: Omit<TransactionFilters, 'cursorDate' | 'cursorId' | 'pageSize'> = {},
) {
  return useInfiniteQuery({
    queryKey: ['transactions', filters] as const,
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const supabase = createClient()
      let cursorDate: string | undefined
      let cursorId: string | undefined

      if (pageParam) {
        const [d, i] = pageParam.split('|')
        cursorDate = d
        cursorId = i
      }

      const { data, error } = await getTransactions(supabase, {
        ...filters,
        cursorDate,
        cursorId,
        pageSize: PAGE_SIZE,
      })

      if (error) throw error
      return data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: TransactionWithRelations[]) => {
      if (lastPage.length < PAGE_SIZE) return undefined
      const last = lastPage[lastPage.length - 1]
      if (!last) return undefined
      return `${last.transaction_date}|${last.id}`
    },
    staleTime: 30_000,
  })
}
