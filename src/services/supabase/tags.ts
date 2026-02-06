import { supabase } from './client'
import type { Tag, TagInput } from '@/types'

export class TagService {
  // Get all tags for a user
  async getTags(userId: string): Promise<Tag[]> {
    try {
      const { data, error } = await supabase
        .from('claude_docs_tags')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching tags:', error)
      return []
    }
  }

  // Create a tag
  async createTag(userId: string, input: TagInput): Promise<Tag | null> {
    try {
      // Check if tag already exists
      const { data: existing } = await supabase
        .from('claude_docs_tags')
        .select('*')
        .eq('user_id', userId)
        .eq('name', input.name)
        .maybeSingle()

      if (existing) {
        console.warn('Tag already exists:', existing)
        return existing as Tag
      }

      const { data, error } = await supabase
        .from('claude_docs_tags')
        .insert({
          user_id: userId,
          name: input.name,
          color: input.color || '#3B82F6',
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating tag:', error)
      return null
    }
  }

  // Update a tag
  async updateTag(tagId: string, updates: Partial<TagInput>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('claude_docs_tags')
        .update(updates)
        .eq('id', tagId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error updating tag:', error)
      return false
    }
  }

  // Delete a tag
  async deleteTag(tagId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('claude_docs_tags')
        .delete()
        .eq('id', tagId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting tag:', error)
      return false
    }
  }

  // Get tags for a document
  async getDocumentTags(documentId: string): Promise<Tag[]> {
    try {
      const { data, error } = await supabase
        .from('claude_docs_document_tags')
        .select('tag_id, claude_docs_tags(*)')
        .eq('document_id', documentId)

      if (error) throw error
      return (data?.map((dt: any) => dt.claude_docs_tags).filter(Boolean) || []) as Tag[]
    } catch (error) {
      console.error('Error fetching document tags:', error)
      return []
    }
  }

  // Add tag to document
  async addTagToDocument(documentId: string, tagId: string): Promise<boolean> {
    try {
      // Check if already tagged
      const { data: existing } = await supabase
        .from('claude_docs_document_tags')
        .select('id')
        .eq('document_id', documentId)
        .eq('tag_id', tagId)
        .maybeSingle()

      if (existing) return true

      const { error } = await supabase
        .from('claude_docs_document_tags')
        .insert({
          document_id: documentId,
          tag_id: tagId,
        })

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error adding tag to document:', error)
      return false
    }
  }

  // Remove tag from document
  async removeTagFromDocument(documentId: string, tagId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('claude_docs_document_tags')
        .delete()
        .eq('document_id', documentId)
        .eq('tag_id', tagId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error removing tag from document:', error)
      return false
    }
  }

  // Set tags for a document (replace all)
  async setDocumentTags(documentId: string, tagIds: string[]): Promise<boolean> {
    try {
      // First, remove all existing tags
      await this.removeDocumentTags(documentId)

      // Then add new tags
      if (tagIds.length > 0) {
        const tagsToAdd = tagIds.map(tagId => ({
          document_id: documentId,
          tag_id: tagId,
        }))

        const { error } = await supabase
          .from('claude_docs_document_tags')
          .insert(tagsToAdd)

        if (error) throw error
      }

      return true
    } catch (error) {
      console.error('Error setting document tags:', error)
      return false
    }
  }

  // Remove all tags from a document
  private async removeDocumentTags(documentId: string): Promise<void> {
    await supabase
      .from('claude_docs_document_tags')
      .delete()
      .eq('document_id', documentId)
  }

  // Get popular tags (most used)
  async getPopularTags(userId: string, limit = 10): Promise<Array<Tag & { count: number }>> {
    try {
      const { data, error } = await supabase
        .from('claude_docs_document_tags')
        .select('tag_id, claude_docs_tags(*)')
        .eq('claude_docs_tags.user_id', userId)

      if (error) throw error

      // Count tag usage
      const tagCounts = new Map<string, number>()
      for (const dt of (data || [])) {
        const tag = (dt as any).claude_docs_tags
        if (tag) {
          tagCounts.set(tag.id, (tagCounts.get(tag.id) || 0) + 1)
        }
      }

      // Sort by count and return top tags
      const sortedTags = Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)

      // Fetch full tag details
      const tags = await this.getTags(userId)
      const tagMap = new Map(tags.map(t => [t.id, t]))

      return sortedTags.map(([tagId, count]) => ({
        ...tagMap.get(tagId)!,
        count,
      }))
    } catch (error) {
      console.error('Error fetching popular tags:', error)
      return []
    }
  }
}

// Export singleton instance
export const tagService = new TagService()
