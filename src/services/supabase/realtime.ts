import { supabase } from './client'
import type { Document, Folder } from '@/types'

export type RealtimeCallback<T> = (payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  old: T | null
  new: T | null
}) => void

class RealtimeService {
  private subscriptions: Map<string, { unsubscribe: () => void }> = new Map()

  // Subscribe to document changes
  subscribeToDocuments(
    userId: string,
    callback: RealtimeCallback<Document>
  ): () => void {
    const channelName = `documents:${userId}`

    // Check if already subscribed
    if (this.subscriptions.has(channelName)) {
      return () => this.unsubscribe(channelName)
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'claude_docs_documents',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            old: (payload.old as Document) || null,
            new: (payload.new as Document) || null,
          })
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime subscription error:', channelName)
        }
      })

    this.subscriptions.set(channelName, { unsubscribe: () => channel.unsubscribe() })

    return () => this.unsubscribe(channelName)
  }

  // Subscribe to folder changes
  subscribeToFolders(
    userId: string,
    callback: RealtimeCallback<Folder>
  ): () => void {
    const channelName = `folders:${userId}`

    if (this.subscriptions.has(channelName)) {
      return () => this.unsubscribe(channelName)
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'claude_docs_folders',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            old: (payload.old as Folder) || null,
            new: (payload.new as Folder) || null,
          })
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime subscription error:', channelName)
        }
      })

    this.subscriptions.set(channelName, { unsubscribe: () => channel.unsubscribe() })

    return () => this.unsubscribe(channelName)
  }

  // Subscribe to a specific document
  subscribeToDocument(
    documentId: string,
    callback: RealtimeCallback<Document>
  ): () => void {
    const channelName = `document:${documentId}`

    if (this.subscriptions.has(channelName)) {
      return () => this.unsubscribe(channelName)
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'claude_docs_documents',
          filter: `id=eq.${documentId}`,
        },
        (payload) => {
          callback({
            eventType: 'UPDATE',
            old: (payload.old as Document) || null,
            new: (payload.new as Document) || null,
          })
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime subscription error:', channelName)
        }
      })

    this.subscriptions.set(channelName, { unsubscribe: () => channel.unsubscribe() })

    return () => this.unsubscribe(channelName)
  }

  // Unsubscribe from a channel
  private unsubscribe(channelName: string): void {
    const subscription = this.subscriptions.get(channelName)
    if (subscription) {
      subscription.unsubscribe()
      this.subscriptions.delete(channelName)
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll(): void {
    for (const [channelName] of this.subscriptions) {
      this.unsubscribe(channelName)
    }
  }

  // Check if online
  isOnline(): boolean {
    return navigator.onLine
  }

  // Listen for online/offline events
  onConnectionChange(callback: (online: boolean) => void): () => void {
    const handleOnline = () => callback(true)
    const handleOffline = () => callback(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService()
