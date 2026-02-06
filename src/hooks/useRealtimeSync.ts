import { useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useDocumentStore } from '@/store/documentStore'
import { useOfflineStore } from '@/store/offlineStore'
import { realtimeService } from '@/services/supabase/realtime'
import { versionService } from '@/services/supabase/versions'
import { offlineQueue } from '@/services/sync/offlineQueue'
import { indexedDBStorage } from '@/services/storage/indexedDB'
import { hasConflict } from '@/services/sync/conflictResolver'
import type { Document } from '@/types'
import { toast } from 'sonner'

/**
 * Hook to enable real-time sync and offline support
 * This should be used in the main App component or Dashboard
 */
export function useRealtimeSync() {
  const user = useAuthStore((state) => state.user)
  const documents = useDocumentStore((state) => state.documents)
  const folders = useDocumentStore((state) => state.folders)
  const setOnline = useOfflineStore((state) => state.setOnline)

  const unsubscribeFns = useRef<(() => void)[]>([])

  // Initialize real-time subscriptions
  useEffect(() => {
    if (!user) return

    // Subscribe to document changes
    const unsubscribeDocs = realtimeService.subscribeToDocuments(
      user.id,
      async (payload) => {
        console.log('Document change:', payload.eventType, payload.new?.id)

        switch (payload.eventType) {
          case 'INSERT':
            if (payload.new) {
              const state = useDocumentStore.getState()
              useDocumentStore.setState({
                documents: [payload.new, ...state.documents],
              })
            }
            break

          case 'UPDATE':
            if (payload.new) {
              const newDoc = payload.new
              const state = useDocumentStore.getState()
              useDocumentStore.setState({
                documents: state.documents.map((doc) =>
                  doc.id === newDoc.id ? newDoc : doc
                ).filter((doc): doc is Document => doc !== null),
                currentDocument:
                  state.currentDocument?.id === newDoc.id
                    ? newDoc
                    : state.currentDocument,
              })

              // Check for conflicts
              const localDoc = documents.find((d) => d.id === newDoc.id)
              if (localDoc && hasConflict(localDoc, newDoc)) {
                // Show conflict notification
                toast.warning('检测到文档冲突', {
                  description: '已自动合并本地和远程更改',
                })
              }
            }
            break

          case 'DELETE':
            if (payload.old) {
              const oldId = payload.old.id
              const state = useDocumentStore.getState()
              useDocumentStore.setState({
                documents: state.documents.filter((d) => d.id !== oldId),
                currentDocument:
                  state.currentDocument?.id === oldId
                    ? null
                    : state.currentDocument,
              })
            }
            break
        }
      }
    )

    // Subscribe to folder changes
    const unsubscribeFolders = realtimeService.subscribeToFolders(
      user.id,
      async (payload) => {
        console.log('Folder change:', payload.eventType, payload.new?.id)

        // Trigger folder refresh on any change
        await useDocumentStore.getState().fetchFolders()
      }
    )

    unsubscribeFns.current.push(unsubscribeDocs, unsubscribeFolders)

    return () => {
      for (const fn of unsubscribeFns.current) {
        fn()
      }
      unsubscribeFns.current = []
    }
  }, [user, documents])

  // Handle online/offline status
  useEffect(() => {
    const unsubscribe = realtimeService.onConnectionChange((online) => {
      setOnline(online)

      if (online) {
        toast.info('网络已连接', {
          description: '正在同步离线更改...',
        })

        // Process offline queue when coming back online
        offlineQueue.processQueue().then(() => {
          toast.success('同步完成')
          // Refresh data
          useDocumentStore.getState().fetchDocuments()
          useDocumentStore.getState().fetchFolders()
        })
      } else {
        toast.warning('网络已断开', {
          description: '更改将在恢复网络后同步',
        })
      }
    })

    return unsubscribe
  }, [setOnline])

  // Initialize IndexedDB and load cached data
  useEffect(() => {
    if (!user) return

    const loadOfflineData = async () => {
      try {
        // Check if we have cached data
        const isStale = await indexedDBStorage.isDataStale()

        if (!isStale) {
          // Load from cache
          const cachedDocs = await indexedDBStorage.getAllDocuments()
          const cachedFolders = await indexedDBStorage.getAllFolders()

          if (cachedDocs.length > 0 || cachedFolders.length > 0) {
            useDocumentStore.setState({
              documents: cachedDocs,
              folders: cachedFolders,
            })
            console.log('Loaded data from IndexedDB cache')
          }
        }
      } catch (error) {
        console.error('Error loading offline data:', error)
      }
    }

    loadOfflineData()
  }, [user])

  // Save to IndexedDB when data changes
  useEffect(() => {
    if (!user) return

    const saveToCache = async () => {
      try {
        for (const doc of documents) {
          await indexedDBStorage.putDocument(doc)
        }

        for (const folder of folders) {
          const saveFolder = (f: any) => {
            indexedDBStorage.putFolder(f)
            if (f.children) {
              f.children.forEach(saveFolder)
            }
          }
          saveFolder(folder)
        }

        // Update sync state
        await indexedDBStorage.saveSyncState({
          lastSyncTime: new Date().toISOString(),
        })
      } catch (error) {
        console.error('Error saving to cache:', error)
      }
    }

    // Debounce save
    const timer = setTimeout(saveToCache, 1000)
    return () => clearTimeout(timer)
  }, [documents, folders, user])
}

/**
 * Hook for version history of a specific document
 */
export function useDocumentVersions(documentId: string | undefined) {
  const [versions, setVersions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const loadVersions = useCallback(async () => {
    if (!documentId) return

    setLoading(true)
    try {
      const data = await versionService.getVersions(documentId)
      setVersions(data)
    } catch (error) {
      console.error('Error loading versions:', error)
    } finally {
      setLoading(false)
    }
  }, [documentId])

  useEffect(() => {
    loadVersions()
  }, [loadVersions])

  const restoreVersion = async (versionId: string) => {
    if (!documentId) return false

    const success = await versionService.restoreVersion(documentId, versionId)
    if (success) {
      toast.success('版本已恢复')
      await loadVersions()
      // Refresh current document
      await useDocumentStore.getState().fetchDocuments()
    } else {
      toast.error('恢复失败')
    }
    return success
  }

  return { versions, loading, loadVersions, restoreVersion }
}

// Import useState
import { useState } from 'react'
