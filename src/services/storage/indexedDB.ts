import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { Document, Folder } from '@/types'

interface ClaudeDocsDB extends DBSchema {
  documents: {
    key: string
    value: Document
    indexes: { 'by-updated': string }
  }
  folders: {
    key: string
    value: Folder
    indexes: { 'by-updated': string }
  }
  pendingChanges: {
    key: string
    value: {
      id: string
      type: 'create' | 'update' | 'delete'
      table: 'documents' | 'folders'
      data: Document | Folder
      timestamp: number
    }
  }
}

const DB_NAME = 'claude-docs-db'
const DB_VERSION = 1

class IndexedDBStorage {
  private db: IDBPDatabase<ClaudeDocsDB> | null = null

  async init(): Promise<void> {
    if (this.db) return

    this.db = await openDB<ClaudeDocsDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Documents store
        if (!db.objectStoreNames.contains('documents')) {
          const docStore = db.createObjectStore('documents', { keyPath: 'id' })
          docStore.createIndex('by-updated', 'updated_at')
        }

        // Folders store
        if (!db.objectStoreNames.contains('folders')) {
          const folderStore = db.createObjectStore('folders', { keyPath: 'id' })
          folderStore.createIndex('by-updated', 'updated_at')
        }

        // Pending changes store
        if (!db.objectStoreNames.contains('pendingChanges')) {
          db.createObjectStore('pendingChanges', { keyPath: 'id' })
        }
      },
    })
  }

  // Documents
  async getAllDocuments(): Promise<Document[]> {
    await this.init()
    return (await this.db!.getAll('documents')) || []
  }

  async getDocument(id: string): Promise<Document | undefined> {
    await this.init()
    return this.db!.get('documents', id)
  }

  async putDocument(doc: Document): Promise<void> {
    await this.init()
    await this.db!.put('documents', doc)
  }

  async deleteDocument(id: string): Promise<void> {
    await this.init()
    await this.db!.delete('documents', id)
  }

  // Folders
  async getAllFolders(): Promise<Folder[]> {
    await this.init()
    return (await this.db!.getAll('folders')) || []
  }

  async getFolder(id: string): Promise<Folder | undefined> {
    await this.init()
    return this.db!.get('folders', id)
  }

  async putFolder(folder: Folder): Promise<void> {
    await this.init()
    await this.db!.put('folders', folder)
  }

  async deleteFolder(id: string): Promise<void> {
    await this.init()
    await this.db!.delete('folders', id)
  }

  // Pending changes
  async addPendingChange(change: {
    id: string
    type: 'create' | 'update' | 'delete'
    table: 'documents' | 'folders'
    data: Document | Folder
    timestamp: number
  }): Promise<void> {
    await this.init()
    await this.db!.put('pendingChanges', change)
  }

  async getPendingChanges(): Promise<
    Array<{
      id: string
      type: 'create' | 'update' | 'delete'
      table: 'documents' | 'folders'
      data: Document | Folder
      timestamp: number
    }>
  > {
    await this.init()
    return (await this.db!.getAll('pendingChanges')) || []
  }

  async removePendingChange(id: string): Promise<void> {
    await this.init()
    await this.db!.delete('pendingChanges', id)
  }

  async clearPendingChanges(): Promise<void> {
    await this.init()
    await this.db!.clear('pendingChanges')
  }

  // Sync state
  async saveSyncState(state: { lastSyncTime: string }): Promise<void> {
    await this.init()
    // Use a separate store for sync state
    const tx = this.db!.transaction('pendingChanges', 'readwrite')
    await (tx.store as any).put({ key: 'syncState', ...state })
  }

  async getSyncState(): Promise<{ lastSyncTime: string } | null> {
    await this.init()
    const tx = this.db!.transaction('pendingChanges', 'readonly')
    return (await (tx.store as any).get('syncState')) || null
  }

  // Clear all data
  async clear(): Promise<void> {
    await this.init()
    await this.db!.clear('documents')
    await this.db!.clear('folders')
    await this.db!.clear('pendingChanges')
  }

  // Check if data is stale
  async isDataStale(maxAge = 24 * 60 * 60 * 1000): Promise<boolean> {
    const syncState = await this.getSyncState()
    if (!syncState?.lastSyncTime) return true

    const lastSync = new Date(syncState.lastSyncTime).getTime()
    const now = Date.now()
    return now - lastSync > maxAge
  }
}

// Export singleton instance
export const indexedDBStorage = new IndexedDBStorage()
