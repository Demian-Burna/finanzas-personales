'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createTransactionAction,
  updateTransactionAction,
  deleteTransactionAction,
  duplicateTransactionAction,
  bulkDeleteTransactionsAction,
} from '@/app/(dashboard)/transactions/actions'
import type { TransactionFormValues } from '@/lib/validations/transaction'

export function useCreateTransaction() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (values: TransactionFormValues) => createTransactionAction(values),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      void qc.invalidateQueries({ queryKey: ['transactions'] })
      toast.success('Transacción creada')
    },
    onError: () => toast.error('Error al crear la transacción'),
  })
}

export function useUpdateTransaction() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: TransactionFormValues }) =>
      updateTransactionAction(id, values),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      void qc.invalidateQueries({ queryKey: ['transactions'] })
      toast.success('Transacción actualizada')
    },
    onError: () => toast.error('Error al actualizar la transacción'),
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteTransactionAction(id),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      void qc.invalidateQueries({ queryKey: ['transactions'] })
      toast.success('Transacción eliminada')
    },
    onError: () => toast.error('Error al eliminar la transacción'),
  })
}

export function useDuplicateTransaction() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => duplicateTransactionAction(id),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      void qc.invalidateQueries({ queryKey: ['transactions'] })
      toast.success('Transacción duplicada')
    },
    onError: () => toast.error('Error al duplicar'),
  })
}

export function useBulkDeleteTransactions() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (ids: string[]) => bulkDeleteTransactionsAction(ids),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      void qc.invalidateQueries({ queryKey: ['transactions'] })
      toast.success('Transacciones eliminadas')
    },
    onError: () => toast.error('Error al eliminar'),
  })
}
