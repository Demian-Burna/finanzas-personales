'use client'

import { useQuery } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import { useSupabase } from '@/hooks/use-supabase'

export function useUser() {
  const supabase = useSupabase()

  return useQuery<User | null>({
    queryKey: ['user'],
    queryFn: async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error || !user) return null
      return user
    },
    staleTime: 5 * 60 * 1000,
  })
}
