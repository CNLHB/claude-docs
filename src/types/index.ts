// ============= User Types =============
export interface User {
  id: string
  email: string
  display_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

// ============= Folder Types =============
export interface Folder {
  id: string
  user_id: string
  parent_id: string | null
  name: string
  icon?: string
  color?: string
  sort_order: number
  created_at: string
  updated_at: string
  children?: Folder[]
  expanded?: boolean
}

export interface FolderInput {
  name: string
  parent_id?: string | null
  icon?: string
  color?: string
}

export interface FolderUpdate extends Partial<FolderInput> {
  id: string
}

// ============= Document Types =============
export interface Document {
  id: string
  user_id: string
  folder_id: string | null
  title: string
  content: string
  is_starred: boolean
  is_archived: boolean
  sort_order: number
  created_at: string
  updated_at: string
  tags?: Tag[]
}

export interface DocumentInput {
  title: string
  content?: string
  folder_id?: string | null
  is_starred?: boolean
  is_archived?: boolean
}

export interface DocumentUpdate extends Partial<DocumentInput> {
  id: string
}

// ============= Tag Types =============
export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface TagInput {
  name: string
  color?: string
}

export interface DocumentTag {
  id: string
  document_id: string
  tag_id: string
  created_at: string
}

// ============= Version Types =============
export interface DocumentVersion {
  id: string
  document_id: string
  content: string
  title: string
  created_at: string
  created_by: string
}

// ============= Share Types =============
export interface Share {
  id: string
  document_id: string
  share_token: string
  password: string | null
  expires_at: string | null
  view_count: number
  created_at: string
  created_by: string
}

export interface ShareInput {
  document_id: string
  password?: string
  expires_at?: string | null
}

// ============= UI Types =============
export type ViewMode = 'list' | 'grid'
export type SortBy = 'name' | 'modified' | 'created'
export type Theme = 'light' | 'dark' | 'system'

export interface UIState {
  sidebarOpen: boolean
  previewOpen: boolean
  viewMode: ViewMode
  sortBy: SortBy
  theme: Theme
  editorFontSize: number
  editorTabSize: number
}

// ============= Offline Types =============
export interface PendingChange {
  id: string
  type: 'create' | 'update' | 'delete'
  table: 'documents' | 'folders'
  data: Document | Folder
  timestamp: number
}

export interface OfflineState {
  isOnline: boolean
  pendingChanges: PendingChange[]
  lastSyncTime: string | null
}

// ============= Search Types =============
export interface SearchResult {
  type: 'document' | 'folder'
  id: string
  title: string
  content?: string
  path: string
  highlight?: string
}

// ============= Auth Types =============
export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

export interface Session {
  access_token: string
  refresh_token: string
  expires_at: number
  user: User | null
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  email: string
  password: string
  display_name?: string
}

// ============= Supabase Types =============
export interface SupabaseError {
  message: string
  code?: string
  details?: string
  hint?: string
}

export type SupabaseResponse<T> =
  | { data: T; error: null }
  | { data: null; error: SupabaseError }
