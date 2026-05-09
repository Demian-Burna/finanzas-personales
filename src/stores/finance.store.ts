import { create } from 'zustand'

interface DateRange {
  from: Date
  to: Date
}

interface FinanceStore {
  selectedPeriod: DateRange
  selectedAccountIds: string[]
  setSelectedPeriod: (period: DateRange) => void
  setSelectedAccountIds: (ids: string[]) => void
  toggleAccountId: (id: string) => void
}

const now = new Date()
const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

export const useFinanceStore = create<FinanceStore>((set) => ({
  selectedPeriod: { from: firstDayOfMonth, to: now },
  selectedAccountIds: [],
  setSelectedPeriod: (period) => set({ selectedPeriod: period }),
  setSelectedAccountIds: (ids) => set({ selectedAccountIds: ids }),
  toggleAccountId: (id) =>
    set((state) => ({
      selectedAccountIds: state.selectedAccountIds.includes(id)
        ? state.selectedAccountIds.filter((a) => a !== id)
        : [...state.selectedAccountIds, id],
    })),
}))
