import { create } from 'zustand'
import { supabase } from '@/services/supabase/client'
import { tagService } from '@/services/supabase/tags'
import type { Tag, TagInput } from '@/types'

interface TagStore {
  tags: Tag[]
  loading: boolean
  error: string | null

  // Actions
  fetchTags: () => Promise<void>
  createTag: (input: TagInput) => Promise<Tag | null>
  updateTag: (id: string, updates: Partial<TagInput>) => Promise<void>
  deleteTag: (id: string) => Promise<void>
  getDocumentTags: (documentId: string) => Promise<Tag[]>
  addTagToDocument: (documentId: string, tagId: string) => Promise<void>
  removeTagFromDocument: (documentId: string, tagId: string) => Promise<void>
  setDocumentTags: (documentId: string, tagIds: string[]) => Promise<void>
  getPopularTags: () => Promise<Array<Tag & { count: number }>>
}

export const useTagStore = create<TagStore>((set) => ({
  tags: [],
  loading: false,
  error: null,

  fetchTags: async () => {
    set({ loading: true })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const tags = await tagService.getTags(user.id)
      set({ tags, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  createTag: async (input) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const tag = await tagService.createTag(user.id, input)
      if (tag) {
        set((state) => ({ tags: [...state.tags, tag] }))
      }
      return tag
    } catch (error: any) {
      set({ error: error.message })
      return null
    }
  },

  updateTag: async (id, updates) => {
    const success = await tagService.updateTag(id, updates)
    if (success) {
      set((state) => ({
        tags: state.tags.map((tag) =>
          tag.id === id ? { ...tag, ...updates } : tag
        ),
      }))
    }
  },

  deleteTag: async (id) => {
    const success = await tagService.deleteTag(id)
    if (success) {
      set((state) => ({
        tags: state.tags.filter((tag) => tag.id !== id),
      }))
    }
  },

  getDocumentTags: async (documentId) => {
    return await tagService.getDocumentTags(documentId)
  },

  addTagToDocument: async (documentId, tagId) => {
    await tagService.addTagToDocument(documentId, tagId)
  },

  removeTagFromDocument: async (documentId, tagId) => {
    await tagService.removeTagFromDocument(documentId, tagId)
  },

  setDocumentTags: async (documentId, tagIds) => {
    await tagService.setDocumentTags(documentId, tagIds)
  },

  getPopularTags: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      return await tagService.getPopularTags(user.id)
    } catch (error) {
      console.error('Error fetching popular tags:', error)
      return []
    }
  },
}))
