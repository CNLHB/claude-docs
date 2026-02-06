/**
 * Supabase 表名常量
 * 使用项目前缀避免与其他项目冲突
 */
export const TABLES = {
  PROFILES: 'claude_docs_profiles',
  DOCUMENTS: 'claude_docs_documents',
  FOLDERS: 'claude_docs_folders',
  TAGS: 'claude_docs_tags',
  DOCUMENT_TAGS: 'claude_docs_document_tags',
  DOCUMENT_VERSIONS: 'claude_docs_document_versions',
  SHARES: 'claude_docs_shares',
} as const

export type Table = typeof TABLES[keyof typeof TABLES]
