import { create } from 'zustand'
import { supabase } from '@/services/supabase/client'
import { tagService } from '@/services/supabase/tags'
import type { Document, Folder, DocumentInput, DocumentUpdate, FolderInput, FolderUpdate, Tag } from '@/types'

interface DocumentStore {
  documents: Document[]
  currentDocument: Document | null
  folders: Folder[]
  selectedFolder: string | null
  loading: boolean
  error: string | null
  documentTags: Map<string, Tag[]> // documentId -> tags

  // Document Actions
  fetchDocuments: (folderId?: string) => Promise<void>
  fetchDocument: (id: string) => Promise<void>
  createDocument: (input: DocumentInput) => Promise<Document>
  updateDocument: (update: DocumentUpdate) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  toggleStarDocument: (id: string) => Promise<void>
  toggleArchiveDocument: (id: string) => Promise<void>
  setCurrentDocument: (doc: Document | null) => void

  // Tag Actions
  fetchDocumentTags: (documentId: string) => Promise<Tag[]>
  setDocumentTags: (documentId: string, tagIds: string[]) => Promise<void>

  // Folder Actions
  fetchFolders: () => Promise<void>
  createFolder: (input: FolderInput) => Promise<Folder>
  updateFolder: (update: FolderUpdate) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  setSelectedFolder: (folderId: string | null) => void
  toggleFolderExpanded: (id: string) => void
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  currentDocument: null,
  folders: [],
  selectedFolder: null,
  loading: false,
  error: null,
  documentTags: new Map(),

  // Fetch documents
  fetchDocuments: async (folderId?: string) => {
    set({ loading: true })
    try {
      const query = supabase
        .from('claude_docs_documents')
        .select('*')
        .is('is_archived', false)
        .order('updated_at', { ascending: false })

      if (folderId) {
        query.eq('folder_id', folderId)
      } else {
        query.is('folder_id', null)
      }

      const { data, error } = await query

      if (error) throw error
      set({ documents: data || [] })
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      set({ loading: false })
    }
  },

  // Create document
  createDocument: async (input) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('claude_docs_documents')
      .insert({
        user_id: user.id,
        title: input.title,
        content: input.content || '',
        folder_id: input.folder_id || null,
      })
      .select()
      .single()

    if (error) throw error
    set((state) => ({ documents: [data, ...state.documents] }))
    return data
  },

  // Update document
  updateDocument: async (update) => {
    try {
      const { error } = await supabase
        .from('claude_docs_documents')
        .update({
          title: update.title,
          content: update.content,
          folder_id: update.folder_id,
          is_starred: update.is_starred,
          is_archived: update.is_archived,
          updated_at: new Date().toISOString(),
        })
        .eq('id', update.id)

      if (error) throw error

      set((state) => ({
        documents: state.documents.map((doc) =>
          doc.id === update.id ? { ...doc, ...update } : doc
        ),
        currentDocument:
          state.currentDocument?.id === update.id
            ? { ...state.currentDocument, ...update }
            : state.currentDocument,
      }))
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  // Toggle star
  toggleStarDocument: async (id) => {
    const doc = get().documents.find((d) => d.id === id)
    if (!doc) return

    try {
      const { error } = await supabase
        .from('claude_docs_documents')
        .update({ is_starred: !doc.is_starred })
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        documents: state.documents.map((d) =>
          d.id === id ? { ...d, is_starred: !d.is_starred } : d
        ),
        currentDocument:
          state.currentDocument?.id === id
            ? { ...state.currentDocument, is_starred: !state.currentDocument.is_starred }
            : state.currentDocument,
      }))
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  // Toggle archive
  toggleArchiveDocument: async (id) => {
    const doc = get().documents.find((d) => d.id === id)
    if (!doc) return

    try {
      const { error } = await supabase
        .from('claude_docs_documents')
        .update({ is_archived: !doc.is_archived })
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        documents: state.documents.filter((d) => d.id !== id),
        currentDocument:
          state.currentDocument?.id === id ? null : state.currentDocument,
      }))
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  // Delete document
  deleteDocument: async (id) => {
    const { error } = await supabase.from('claude_docs_documents').delete().eq('id', id)

    if (error) throw error

    set((state) => ({
      documents: state.documents.filter((doc) => doc.id !== id),
      currentDocument: state.currentDocument?.id === id ? null : state.currentDocument,
    }))
  },

  setCurrentDocument: (doc) => set({ currentDocument: doc }),

  // Fetch single document
  fetchDocument: async (id) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('claude_docs_documents')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      set({ currentDocument: data })
    } catch (error) {
      console.error('Error fetching document:', error)
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  // Fetch folders
  fetchFolders: async () => {
    set({ loading: true })
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('claude_docs_folders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Build tree structure
      const buildTree = (items: Folder[], parentId: string | null = null): Folder[] => {
        return items
          .filter((item) => item.parent_id === parentId)
          .map((item) => ({
            ...item,
            expanded: false,
            children: buildTree(items, item.id),
          }))
      }

      set({ folders: buildTree(data || []) })
    } catch (error) {
      console.error('Error fetching folders:', error)
    } finally {
      set({ loading: false })
    }
  },

  // Create folder
  createFolder: async (input) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('claude_docs_folders')
        .insert({
          user_id: user.id,
          name: input.name,
          parent_id: input.parent_id || null,
          icon: input.icon || 'folder',
          color: input.color || '#3B82F6',
        })
        .select()
        .single()

      if (error) throw error

      set((state) => {
        // If it's a root folder, add to root
        if (!input.parent_id) {
          return {
            folders: [...state.folders, { ...data, children: [], expanded: false }],
          }
        }
        // Otherwise, add to parent folder
        return {
          folders: addFolderToTree(state.folders, input.parent_id, data),
        }
      })

      return data
    } catch (error: any) {
      set({ error: error.message })
      throw error
    }
  },

  // Update folder
  updateFolder: async (update) => {
    try {
      const { error } = await supabase
        .from('claude_docs_folders')
        .update({
          name: update.name,
          icon: update.icon,
          color: update.color,
          parent_id: update.parent_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', update.id)

      if (error) throw error

      set((state) => ({
        folders: updateFolderInTree(state.folders, update.id, update),
      }))
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  // Delete folder
  deleteFolder: async (id) => {
    const { error } = await supabase.from('claude_docs_folders').delete().eq('id', id)

    if (error) throw error

    set((state) => ({
      folders: removeFolderFromTree(state.folders, id),
    }))
  },

  setSelectedFolder: (folderId) => set({ selectedFolder: folderId }),

  toggleFolderExpanded: (id) => {
    set((state) => ({
      folders: toggleFolderInTree(state.folders, id),
    }))
  },

  // Fetch document tags
  fetchDocumentTags: async (documentId) => {
    const tags = await tagService.getDocumentTags(documentId)
    set((state) => {
      const newTags = new Map(state.documentTags)
      newTags.set(documentId, tags)
      return { documentTags: newTags }
    })
    return tags
  },

  // Set document tags
  setDocumentTags: async (documentId, tagIds) => {
    await tagService.setDocumentTags(documentId, tagIds)
    // Refresh tags
    await get().fetchDocumentTags(documentId)
  },
}))

// Helper function to update folder in tree
function updateFolderInTree(folders: Folder[], id: string, updates: Partial<FolderInput>): Folder[] {
  return folders.map((folder) => {
    if (folder.id === id) {
      return { ...folder, ...updates }
    }
    if (folder.children) {
      return {
        ...folder,
        children: updateFolderInTree(folder.children, id, updates),
      }
    }
    return folder
  })
}

// Helper function to add folder to tree
function addFolderToTree(folders: Folder[], parentId: string, newFolder: Folder): Folder[] {
  return folders.map((folder) => {
    if (folder.id === parentId) {
      return {
        ...folder,
        children: [...(folder.children || []), { ...newFolder, children: [], expanded: false }],
      }
    }
    if (folder.children) {
      return {
        ...folder,
        children: addFolderToTree(folder.children, parentId, newFolder),
      }
    }
    return folder
  })
}

// Helper function to toggle folder expanded state
function toggleFolderInTree(folders: Folder[], id: string): Folder[] {
  return folders.map((folder) => {
    if (folder.id === id) {
      return { ...folder, expanded: !folder.expanded }
    }
    if (folder.children) {
      return {
        ...folder,
        children: toggleFolderInTree(folder.children, id),
      }
    }
    return folder
  })
}

// Helper function to remove folder from tree
function removeFolderFromTree(folders: Folder[], id: string): Folder[] {
  return folders
    .filter((folder) => folder.id !== id)
    .map((folder) => ({
      ...folder,
      children: folder.children ? removeFolderFromTree(folder.children, id) : undefined,
    }))
}
