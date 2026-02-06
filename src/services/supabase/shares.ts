import { supabase } from './client'
import type { Share, ShareInput } from '@/types'

export class ShareService {
  // Create a share link
  async createShare(input: ShareInput): Promise<Share | null> {
    try {
      // Generate a random token
      const token = this.generateToken()

      const { data, error } = await supabase
        .from('claude_docs_shares')
        .insert({
          document_id: input.document_id,
          share_token: token,
          password: input.password || null,
          expires_at: input.expires_at || null,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating share:', error)
      return null
    }
  }

  // Get share for a document
  async getDocumentShare(documentId: string): Promise<Share | null> {
    try {
      const { data, error } = await supabase
        .from('claude_docs_shares')
        .select('*')
        .eq('document_id', documentId)
        .maybeSingle()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching share:', error)
      return null
    }
  }

  // Update share settings
  async updateShare(shareId: string, updates: Partial<ShareInput>): Promise<boolean> {
    try {
      const updateData: any = {}
      if (updates.password !== undefined) updateData.password = updates.password
      if (updates.expires_at !== undefined) updateData.expires_at = updates.expires_at

      const { error } = await supabase
        .from('claude_docs_shares')
        .update(updateData)
        .eq('id', shareId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error updating share:', error)
      return false
    }
  }

  // Delete share
  async deleteShare(shareId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('claude_docs_shares')
        .delete()
        .eq('id', shareId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting share:', error)
      return false
    }
  }

  // Validate share access
  async validateShare(token: string, password?: string): Promise<{
    valid: boolean
    share: Share | null
    error?: string
  }> {
    try {
      const { data: share, error } = await supabase
        .from('claude_docs_shares')
        .select('*')
        .eq('share_token', token)
        .maybeSingle()

      if (error) throw error
      if (!share) {
        return { valid: false, share: null, error: '分享链接不存在或已失效' }
      }

      // Check expiration
      if (share.expires_at) {
        const expiresAt = new Date(share.expires_at)
        if (expiresAt < new Date()) {
          return { valid: false, share: null, error: '分享链接已过期' }
        }
      }

      // Check password
      if (share.password && share.password !== password) {
        return { valid: false, share: null, error: '密码错误' }
      }

      // Increment view count
      await supabase
        .from('claude_docs_shares')
        .update({ view_count: (share.view_count || 0) + 1 })
        .eq('id', share.id)

      return { valid: true, share }
    } catch (error) {
      console.error('Error validating share:', error)
      return { valid: false, share: null, error: '验证失败' }
    }
  }

  // Get shared document by token
  async getSharedDocument(token: string, password?: string): Promise<{
    document: any | null
    share: Share | null
    error?: string
  }> {
    const validation = await this.validateShare(token, password)

    if (!validation.valid) {
      return {
        document: null,
        share: null,
        error: validation.error,
      }
    }

    try {
      const { data: document, error } = await supabase
        .from('claude_docs_documents')
        .select('*')
        .eq('id', validation.share!.document_id)
        .single()

      if (error) throw error

      return {
        document,
        share: validation.share!,
      }
    } catch (error) {
      console.error('Error fetching shared document:', error)
      return {
        document: null,
        share: validation.share!,
        error: '获取文档失败',
      }
    }
  }

  // Generate random token
  private generateToken(length = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Get share URL
  getShareUrl(token: string): string {
    return `${window.location.origin}/share/${token}`
  }
}

// Export singleton instance
export const shareService = new ShareService()
