import { supabase } from '@/services/supabase/client'
import { indexedDBStorage } from '@/services/storage/indexedDB'
import type { Document, Folder } from '@/types'

export interface QueuedOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  table: 'documents' | 'folders'
  data: any
  timestamp: number
  retries: number
}

class OfflineQueue {
  private processing = false
  private maxRetries = 3

  // Add operation to queue
  async enqueue(operation: Omit<QueuedOperation, 'timestamp' | 'retries'>): Promise<void> {
    const queuedOp: QueuedOperation = {
      ...operation,
      timestamp: Date.now(),
      retries: 0,
    }

    await indexedDBStorage.addPendingChange(queuedOp)
  }

  // Process all queued operations
  async processQueue(): Promise<void> {
    if (this.processing || !navigator.onLine) {
      return
    }

    this.processing = true

    try {
      const pendingChanges = await indexedDBStorage.getPendingChanges()

      for (const change of pendingChanges) {
        // Cast to QueuedOperation with retries
        const op = change as QueuedOperation
        const success = await this.processOperation(op)

        if (success) {
          await indexedDBStorage.removePendingChange(change.id)
        } else if ((op.retries || 0) >= this.maxRetries) {
          // Max retries reached, remove from queue
          await indexedDBStorage.removePendingChange(change.id)
          console.error('Operation failed after max retries:', change)
        } else {
          // Increment retry count and save back
          await indexedDBStorage.addPendingChange({
            ...change,
            retries: (op.retries || 0) + 1,
          } as any)
          await indexedDBStorage.removePendingChange(change.id)
        }
      }
    } finally {
      this.processing = false
    }
  }

  // Process a single operation
  private async processOperation(op: QueuedOperation): Promise<boolean> {
    try {
      switch (op.table) {
        case 'documents':
          return await this.processDocumentOperation(op)
        case 'folders':
          return await this.processFolderOperation(op)
        default:
          return false
      }
    } catch (error) {
      console.error('Error processing operation:', error)
      return false
    }
  }

  // Process document operations
  private async processDocumentOperation(op: QueuedOperation): Promise<boolean> {
    const doc = op.data as Document

    switch (op.type) {
      case 'create': {
        const { error } = await supabase
          .from('claude_docs_documents')
          .insert({
            id: doc.id,
            user_id: doc.user_id,
            title: doc.title,
            content: doc.content,
            folder_id: doc.folder_id,
            is_starred: doc.is_starred,
            is_archived: doc.is_archived,
            sort_order: doc.sort_order,
          })

        return !error
      }

      case 'update': {
        const { error } = await supabase
          .from('claude_docs_documents')
          .update({
            title: doc.title,
            content: doc.content,
            folder_id: doc.folder_id,
            is_starred: doc.is_starred,
            is_archived: doc.is_archived,
            updated_at: new Date().toISOString(),
          })
          .eq('id', doc.id)

        return !error
      }

      case 'delete': {
        const { error } = await supabase
          .from('claude_docs_documents')
          .delete()
          .eq('id', doc.id)

        return !error
      }

      default:
        return false
    }
  }

  // Process folder operations
  private async processFolderOperation(op: QueuedOperation): Promise<boolean> {
    const folder = op.data as Folder

    switch (op.type) {
      case 'create': {
        const { error } = await supabase
          .from('claude_docs_folders')
          .insert({
            id: folder.id,
            user_id: folder.user_id,
            name: folder.name,
            parent_id: folder.parent_id,
            icon: folder.icon,
            color: folder.color,
            sort_order: folder.sort_order,
          })

        return !error
      }

      case 'update': {
        const { error } = await supabase
          .from('claude_docs_folders')
          .update({
            name: folder.name,
            icon: folder.icon,
            color: folder.color,
            parent_id: folder.parent_id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', folder.id)

        return !error
      }

      case 'delete': {
        const { error } = await supabase
          .from('claude_docs_folders')
          .delete()
          .eq('id', folder.id)

        return !error
      }

      default:
        return false
    }
  }

  // Get queue size
  async getQueueSize(): Promise<number> {
    const pendingChanges = await indexedDBStorage.getPendingChanges()
    return pendingChanges.length
  }

  // Clear queue
  async clearQueue(): Promise<void> {
    await indexedDBStorage.clearPendingChanges()
  }

  // Check if processing
  isProcessing(): boolean {
    return this.processing
  }
}

// Export singleton instance
export const offlineQueue = new OfflineQueue()
