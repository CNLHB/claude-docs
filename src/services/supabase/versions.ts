import { supabase } from './client'
import type { DocumentVersion } from '@/types'

export class VersionService {
  // Create a version snapshot
  async createVersion(
    documentId: string,
    content: string,
    title: string,
    userId: string
  ): Promise<DocumentVersion | null> {
    try {
      const { data, error } = await supabase
        .from('claude_docs_document_versions')
        .insert({
          document_id: documentId,
          content,
          title,
          created_by: userId,
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating version:', error)
      return null
    }
  }

  // Get version history for a document
  async getVersions(documentId: string): Promise<DocumentVersion[]> {
    try {
      const { data, error } = await supabase
        .from('claude_docs_document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching versions:', error)
      return []
    }
  }

  // Get a specific version
  async getVersion(versionId: string): Promise<DocumentVersion | null> {
    try {
      const { data, error } = await supabase
        .from('claude_docs_document_versions')
        .select('*')
        .eq('id', versionId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching version:', error)
      return null
    }
  }

  // Restore a version (creates a new version with old content)
  async restoreVersion(
    documentId: string,
    versionId: string
  ): Promise<boolean> {
    try {
      // Get the version to restore
      const version = await this.getVersion(versionId)
      if (!version) return false

      // Update the document with the version content
      const { error } = await supabase
        .from('claude_docs_documents')
        .update({
          content: version.content,
          title: version.title,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error restoring version:', error)
      return false
    }
  }

  // Delete old versions (keep last N versions)
  async cleanupOldVersions(documentId: string, keepCount = 20): Promise<void> {
    try {
      // Get all versions ordered by date
      const { data: versions } = await supabase
        .from('claude_docs_document_versions')
        .select('id')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })

      if (!versions || versions.length <= keepCount) return

      // Delete versions beyond the keep count
      const toDelete = versions.slice(keepCount)
      const idsToDelete = toDelete.map((v) => v.id)

      const { error } = await supabase
        .from('claude_docs_document_versions')
        .delete()
        .in('id', idsToDelete)

      if (error) throw error
    } catch (error) {
      console.error('Error cleaning up versions:', error)
    }
  }

  // Auto-save version with debounce
  private saveTimers: Map<string, NodeJS.Timeout> = new Map()

  scheduleAutoSave(
    documentId: string,
    content: string,
    title: string,
    userId: string,
    delay = 30000 // 30 seconds
  ): void {
    // Clear existing timer
    const existingTimer = this.saveTimers.get(documentId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // Set new timer
    const timer = setTimeout(async () => {
      await this.createVersion(documentId, content, title, userId)
      this.saveTimers.delete(documentId)
    }, delay)

    this.saveTimers.set(documentId, timer)
  }

  cancelAutoSave(documentId: string): void {
    const timer = this.saveTimers.get(documentId)
    if (timer) {
      clearTimeout(timer)
      this.saveTimers.delete(documentId)
    }
  }

  // Clear all timers
  clearAllTimers(): void {
    for (const [, timer] of this.saveTimers) {
      clearTimeout(timer)
    }
    this.saveTimers.clear()
  }
}

// Export singleton instance
export const versionService = new VersionService()
