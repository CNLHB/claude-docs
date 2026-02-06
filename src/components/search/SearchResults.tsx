import { Search, X, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { SearchResult } from '@/types'

interface SearchResultsProps {
  results: SearchResult[]
  query: string
  onClose: () => void
}

export function SearchResults({ results, query, onClose }: SearchResultsProps) {
  const navigate = useNavigate()

  const handleClick = (result: SearchResult) => {
    navigate(`/editor/${result.id}`)
    onClose()
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Search className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          {query ? `没有找到与 "${query}" 相关的文档` : '输入关键词搜索文档'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          找到 {results.length} 个结果
        </p>
        <button
          onClick={onClose}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-1">
        {results.map((result) => (
          <button
            key={result.id}
            onClick={() => handleClick(result)}
            className="w-full rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="truncate font-medium">{result.title}</h3>

                {result.path && result.path !== result.title && (
                  <p className="truncate text-xs text-muted-foreground">
                    {result.path}
                  </p>
                )}

                {result.highlight && (
                  <p
                    className="mt-1 line-clamp-2 text-sm text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: result.highlight }}
                  />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
