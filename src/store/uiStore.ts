import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ViewMode, SortBy, Theme } from '@/types'

interface UIStore {
  // State
  sidebarOpen: boolean
  previewOpen: boolean
  viewMode: ViewMode
  sortBy: SortBy
  theme: Theme
  editorFontSize: number
  editorTabSize: number

  // Actions
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  togglePreview: () => void
  setPreviewOpen: (open: boolean) => void
  setViewMode: (mode: ViewMode) => void
  setSortBy: (sortBy: SortBy) => void
  setTheme: (theme: Theme) => void
  setEditorFontSize: (size: number) => void
  setEditorTabSize: (size: number) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // Initial state
      sidebarOpen: true,
      previewOpen: true,
      viewMode: 'list',
      sortBy: 'modified',
      theme: 'system',
      editorFontSize: 14,
      editorTabSize: 2,

      // Actions
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      togglePreview: () => set((state) => ({ previewOpen: !state.previewOpen })),
      setPreviewOpen: (open) => set({ previewOpen: open }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setSortBy: (sortBy) => set({ sortBy }),
      setTheme: (theme) => set({ theme }),
      setEditorFontSize: (size) => set({ editorFontSize: size }),
      setEditorTabSize: (size) => set({ editorTabSize: size }),
    }),
    {
      name: 'claude-docs-ui',
    }
  )
)
