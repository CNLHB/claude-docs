import type { Document } from '@/types'

export type ConflictResolution = 'local' | 'remote' | 'merge'

export interface ConflictData {
  local: Document
  remote: Document
  base?: Document
}

// Conflict detection
export function hasConflict(local: Document, remote: Document): boolean {
  // If local version is newer, no conflict
  if (new Date(local.updated_at) > new Date(remote.updated_at)) {
    return false
  }

  // Check if there are actual differences in content
  return (
    local.title !== remote.title ||
    local.content !== remote.content ||
    local.is_starred !== remote.is_starred ||
    local.is_archived !== remote.is_archived
  )
}

// Auto-resolve strategy
export function autoResolveConflict(data: ConflictData): Document {
  const { local, remote } = data

  // If remote is newer, prefer remote
  if (new Date(remote.updated_at) > new Date(local.updated_at)) {
    // But preserve local changes if they were made independently
    return mergeDocuments(local, remote)
  }

  // Local is newer, prefer local
  return local
}

// Merge documents - preserve both changes where possible
function mergeDocuments(local: Document, remote: Document): Document {
  // If content is the same, use the most recent metadata
  if (local.content === remote.content) {
    return {
      ...remote,
      // Preserve local star/archive changes as they're user preferences
      is_starred: local.is_starred,
      is_archived: local.is_archived,
    }
  }

  // Content differs - use the newer version
  const newer = new Date(remote.updated_at) > new Date(local.updated_at) ? remote : local

  return {
    ...newer,
    // Preserve star/archive from both (OR them together)
    is_starred: local.is_starred || remote.is_starred,
  }
}

// Manual resolution with UI
export function createMergedDocument(
  local: Document,
  remote: Document,
  resolution: ConflictResolution
): Document {
  switch (resolution) {
    case 'local':
      return {
        ...local,
        updated_at: new Date().toISOString(),
      }

    case 'remote':
      return {
        ...remote,
        updated_at: new Date().toISOString(),
      }

    case 'merge':
      return mergeDocuments(local, remote)

    default:
      return remote
  }
}

// Generate a conflict summary for UI display
export function getConflictSummary(data: ConflictData): {
  titleChanged: boolean
  contentChanged: boolean
  metadataChanged: boolean
  winner: 'local' | 'remote'
} {
  const { local, remote } = data

  const titleChanged = local.title !== remote.title
  const contentChanged = local.content !== remote.content
  const metadataChanged =
    local.is_starred !== remote.is_starred ||
    local.is_archived !== remote.is_archived ||
    local.folder_id !== remote.folder_id

  const winner =
    new Date(local.updated_at) > new Date(remote.updated_at) ? 'local' : 'remote'

  return {
    titleChanged,
    contentChanged,
    metadataChanged,
    winner,
  }
}

// Create a conflict message
export function getConflictMessage(data: ConflictData): string {
  const summary = getConflictSummary(data)

  if (summary.contentChanged) {
    return `内容冲突: ${summary.winner === 'local' ? '本地' : '远程'}版本更新`
  }

  if (summary.titleChanged) {
    return `标题冲突: ${summary.winner === 'local' ? '本地' : '远程'}版本更新`
  }

  if (summary.metadataChanged) {
    return `元数据冲突: 已自动合并`
  }

  return '未知冲突'
}

// Apply conflict resolution to a document
export async function applyConflictResolution(
  _documentId: string,
  resolution: ConflictResolution,
  local: Document,
  remote: Document
): Promise<Document> {
  const merged = createMergedDocument(local, remote, resolution)

  // Here you would typically save to the database
  // For now, just return the merged document
  return merged
}

// Diff viewer helper
export function getTextDiffs(local: string, remote: string): {
  added: string[]
  removed: string[]
  unchanged: string[]
} {
  const localLines = local.split('\n')
  const remoteLines = remote.split('\n')

  const added: string[] = []
  const removed: string[] = []
  const unchanged: string[] = []

  let localIndex = 0
  let remoteIndex = 0

  while (localIndex < localLines.length || remoteIndex < remoteLines.length) {
    const localLine = localLines[localIndex]
    const remoteLine = remoteLines[remoteIndex]

    if (localLine === remoteLine) {
      unchanged.push(localLine || '')
      localIndex++
      remoteIndex++
    } else if (localIndex < localLines.length && remoteIndex < remoteLines.length) {
      removed.push(localLine || '')
      added.push(remoteLine || '')
      localIndex++
      remoteIndex++
    } else if (localIndex < localLines.length) {
      removed.push(localLine || '')
      localIndex++
    } else {
      added.push(remoteLine || '')
      remoteIndex++
    }
  }

  return { added, removed, unchanged }
}
