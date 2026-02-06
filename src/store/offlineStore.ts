import { create } from 'zustand'
import type { OfflineState, PendingChange } from '@/types'

interface OfflineStore extends OfflineState {
  // Actions
  setOnline: (online: boolean) => void
  addPendingChange: (change: PendingChange) => void
  removePendingChange: (id: string) => void
  clearPendingChanges: () => void
  setLastSyncTime: (time: string) => void
  syncPendingChanges: () => Promise<void>
}

export const useOfflineStore = create<OfflineStore>((set, get) => ({
  isOnline: navigator.onLine,
  pendingChanges: [],
  lastSyncTime: null,

  setOnline: (online) => set({ isOnline: online }),

  addPendingChange: (change) =>
    set((state) => ({
      pendingChanges: [...state.pendingChanges, change],
    })),

  removePendingChange: (id) =>
    set((state) => ({
      pendingChanges: state.pendingChanges.filter((c) => c.id !== id),
    })),

  clearPendingChanges: () => set({ pendingChanges: [] }),

  setLastSyncTime: (time) => set({ lastSyncTime: time }),

  syncPendingChanges: async () => {
    const state = get()
    if (!state.isOnline || state.pendingChanges.length === 0) {
      return
    }

    // Process each pending change
    for (const change of state.pendingChanges) {
      try {
        // This will be implemented based on change type
        // For now, just mark as processed by removing
        get().removePendingChange(change.id)
      } catch (error) {
        console.error('Error syncing change:', error)
      }
    }
  },
}))
