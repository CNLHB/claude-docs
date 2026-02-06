import type { Document, SearchResult } from '@/types'

// 简单的分词器 - 支持中英文
export function tokenize(text: string): string[] {
  // 移除特殊字符，保留中文、字母、数字
  const cleaned = text.toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9\s]/gi, ' ')
  // 分词 - 按空格和常见中文分隔符
  return cleaned
    .split(/[\s\n\r\t,.;:!?()、，。；：！？（）【】「」""'']+/)
    .filter((token) => token.length > 0)
}

// 计算文本相关性分数
export function calculateRelevance(
  queryTokens: string[],
  title: string,
  content: string
): number {
  const titleLower = title.toLowerCase()
  const contentLower = content.toLowerCase()
  let score = 0

  for (const token of queryTokens) {
    // 标题完全匹配权重最高
    if (titleLower === token) {
      score += 100
    }
    // 标题以查询词开头
    else if (titleLower.startsWith(token)) {
      score += 50
    }
    // 标题包含查询词
    else if (titleLower.includes(token)) {
      score += 20
    }

    // 内容中查询词出现次数
    const contentMatches = (contentLower.match(new RegExp(token, 'g')) || []).length
    score += contentMatches * 5

    // 连续匹配加分
    if (titleLower.includes(token)) {
      const wordsBefore = titleLower.substring(0, titleLower.indexOf(token)).split(/\s+/).length
      score += Math.max(0, 10 - wordsBefore)
    }
  }

  return score
}

// 高亮搜索结果中的匹配文本
export function highlightMatches(text: string, query: string, maxLength = 200): string {
  if (!query) return text.substring(0, maxLength)

  const tokens = tokenize(query)
  if (tokens.length === 0) return text.substring(0, maxLength)

  // 创建正则表达式来匹配所有搜索词
  const pattern = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi')

  // 找到第一个匹配位置
  const firstMatch = text.match(pattern)
  if (!firstMatch) return text.substring(0, maxLength)

  const matchIndex = text.indexOf(firstMatch[0])
  let start = Math.max(0, matchIndex - 50)
  let end = Math.min(text.length, matchIndex + maxLength)

  // 如果不是从开头开始，添加省略号
  let result = start > 0 ? '...' : ''
  result += text.substring(start, end)

  // 高亮匹配
  result = result.replace(pattern, '<mark>$1</mark>')

  // 如果不是到结尾，添加省略号
  if (end < text.length) {
    result += '...'
  }

  return result
}

// 转义正则表达式特殊字符
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 在文档列表中搜索
export function searchDocuments(
  documents: Document[],
  query: string,
  folders?: Map<string, string>
): SearchResult[] {
  if (!query.trim()) return []

  const tokens = tokenize(query)
  if (tokens.length === 0) return []

  const results: SearchResult[] = []

  for (const doc of documents) {
    const relevance = calculateRelevance(tokens, doc.title, doc.content)

    if (relevance > 0) {
      // 构建路径
      let path = doc.title
      if (doc.folder_id && folders?.has(doc.folder_id)) {
        path = `${folders.get(doc.folder_id)}/${path}`
      }

      results.push({
        type: 'document',
        id: doc.id,
        title: doc.title,
        content: doc.content,
        path,
        highlight: highlightMatches(doc.content, query),
      })
    }
  }

  // 按相关性分数排序
  return results.sort((a, b) => {
    const scoreA = calculateRelevance(tokens, a.title, a.content || '')
    const scoreB = calculateRelevance(tokens, b.title, b.content || '')
    return scoreB - scoreA
  })
}

// 模糊搜索 - 使用简单的编辑距离算法
export function fuzzyMatch(text: string, query: string, threshold = 0.6): number {
  const textLower = text.toLowerCase()
  const queryLower = query.toLowerCase()

  if (textLower.includes(queryLower)) return 1

  // 简单的子字符串匹配分数
  let score = 0
  let queryIndex = 0
  let textIndex = 0

  while (queryIndex < queryLower.length && textIndex < textLower.length) {
    if (queryLower[queryIndex] === textLower[textIndex]) {
      score++
      queryIndex++
    }
    textIndex++
  }

  return score / queryLower.length >= threshold ? score / queryLower.length : 0
}

// 获取搜索建议（基于历史搜索和文档标题）
export function getSearchSuggestions(
  documents: Document[],
  query: string,
  maxSuggestions = 5
): string[] {
  if (!query.trim() || query.length < 2) return []

  const tokens = tokenize(query)
  const suggestions = new Set<string>()

  for (const doc of documents) {
    const titleLower = doc.title.toLowerCase()

    // 检查标题是否包含任何查询词
    for (const token of tokens) {
      if (titleLower.includes(token)) {
        suggestions.add(doc.title)
        break
      }
    }

    if (suggestions.size >= maxSuggestions) break
  }

  return Array.from(suggestions)
}
