import { create } from 'zustand'
import { searchDocuments } from '@/utils/search/indexer'
import type { Document, SearchResult } from '@/types'

interface SearchStore {
  // State
  query: string
  results: SearchResult[]
  isOpen: boolean
  selectedIndex: number
  recentSearches: string[]
  isSearching: boolean

  // Actions
  setQuery: (query: string) => void
  setSearchResults: (results: SearchResult[]) => void
  setOpen: (open: boolean) => void
  setSelectedIndex: (index: number) => void
  performSearch: (query: string, documents: Document[], folderNames?: Map<string, string>) => void
  clearSearch: () => void
  addToRecentSearches: (query: string) => void
  clearRecentSearches: () => void
  selectNext: () => void
  selectPrevious: () => void
  getSelectedResult: () => SearchResult | null
}

export const useSearchStore = create<SearchStore>((set, get) => ({
  // Initial State
  query: '',
  results: [],
  isOpen: false,
  selectedIndex: 0,
  recentSearches: [],
  isSearching: false,

  // Actions
  setQuery: (query) => set({ query, selectedIndex: 0 }),

  setSearchResults: (results) => set({ results }),

  setOpen: (open) => {
    set({ isOpen: open })
    if (!open) {
      // Clear search when closing
      set({ query: '', results: [], selectedIndex: 0 })
    }
  },

  setSelectedIndex: (index) => set({ selectedIndex: index }),

  performSearch: (query, documents, folderNames) => {
    set({ query, isSearching: true })

    if (!query.trim()) {
      set({ results: [], isSearching: false })
      return
    }

    // Simulate async search for better UX
    setTimeout(() => {
      const results = searchDocuments(documents, query, folderNames)
      set({ results, isSearching: false })
    }, 50)
  },

  clearSearch: () => set({ query: '', results: [], selectedIndex: 0 }),

  addToRecentSearches: (query) => {
    const trimmed = query.trim()
    if (!trimmed) return

    set((state) => {
      const recent = state.recentSearches.filter((q) => q !== trimmed)
      recent.unshift(trimmed)
      // Keep only last 10 searches
      return { recentSearches: recent.slice(0, 10) }
    })
  },

  clearRecentSearches: () => set({ recentSearches: [] }),

  selectNext: () => {
    set((state) => ({
      selectedIndex: Math.min(state.selectedIndex + 1, state.results.length - 1),
    }))
  },

  selectPrevious: () => {
    set((state) => ({
      selectedIndex: Math.max(state.selectedIndex - 1, 0),
    }))
  },

  getSelectedResult: () => {
    const state = get()
    return state.results[state.selectedIndex] || null
  },
}))
