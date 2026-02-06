import { create } from 'zustand'
import { supabase } from '@/services/supabase/client'
import type { Document, Folder, DocumentInput, FolderInput } from '@/types'

interface DocumentStore {
  documents: Document[]
  currentDocument: Document | null
  folders: Folder[]
  selectedFolder: string | null
  loading: boolean

  // Document Actions
  fetchDocuments: (folderId?: string) => Promise<void>
  createDocument: (input: DocumentInput) => Promise<Document>
  updateDocument: (id: string, updates: Partial<DocumentInput>) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  setCurrentDocument: (doc: Document | null) => void

  // Folder Actions
  fetchFolders: () => Promise<void>
  createFolder: (input: FolderInput) => Promise<Folder>
  updateFolder: (id: string, updates: Partial<FolderInput>) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  setSelectedFolder: (folderId: string | null) => void
}

export const useDocumentStore = create<DocumentStore>((set) => ({
  documents: [],
  currentDocument: null,
  folders: [],
  selectedFolder: null,
  loading: false,

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
  updateDocument: async (id, updates) => {
    const { error } = await supabase.from('claude_docs_documents').update(updates).eq('id', id)

    if (error) throw error

    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id ? { ...doc, ...updates } : doc
      ),
      currentDocument:
        state.currentDocument?.id === id
          ? { ...state.currentDocument, ...updates }
          : state.currentDocument,
    }))
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
        icon: input.icon,
        color: input.color,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update folder
  updateFolder: async (id, updates) => {
    const { error } = await supabase.from('claude_docs_folders').update(updates).eq('id', id)

    if (error) throw error

    set((state) => ({
      folders: updateFolderInTree(state.folders, id, updates),
    }))
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

// Helper function to remove folder from tree
function removeFolderFromTree(folders: Folder[], id: string): Folder[] {
  return folders
    .filter((folder) => folder.id !== id)
    .map((folder) => ({
      ...folder,
      children: folder.children ? removeFolderFromTree(folder.children, id) : undefined,
    }))
}
