import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
  quickAddOpen: boolean
  moreSheetOpen: boolean
  notificationsOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setQuickAddOpen: (open: boolean) => void
  setMoreSheetOpen: (open: boolean) => void
  setNotificationsOpen: (open: boolean) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'system',
      quickAddOpen: false,
      moreSheetOpen: false,
      notificationsOpen: false,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => set({ theme }),
      setQuickAddOpen: (open) => set({ quickAddOpen: open }),
      setMoreSheetOpen: (open) => set({ moreSheetOpen: open }),
      setNotificationsOpen: (open) => set({ notificationsOpen: open }),
    }),
    { name: 'ui-store' }
  )
)
