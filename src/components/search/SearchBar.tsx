import { useEffect, useRef, useState } from 'react'
import { Search, X, Clock, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSearchStore } from '@/store/searchStore'
import { useDocumentStore } from '@/store/documentStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface SearchBarProps {
  trigger?: React.ReactNode
}

export function SearchBar({ trigger }: SearchBarProps) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const {
    query,
    results,
    isOpen,
    selectedIndex,
    recentSearches,
    isSearching,
    setQuery,
    setOpen,
    setSearchResults,
    performSearch,
    clearSearch,
    addToRecentSearches,
    clearRecentSearches,
    selectNext,
    selectPrevious,
    getSelectedResult,
  } = useSearchStore()

  const documents = useDocumentStore((state) => state.documents)
  const folders = useDocumentStore((state) => state.folders)

  // Build folder name map
  const folderNames = useState(() => {
    const map = new Map<string, string>()
    const buildMap = (folders: any[]) => {
      for (const folder of folders) {
        map.set(folder.id, folder.name)
        if (folder.children) {
          buildMap(folder.children)
        }
      }
    }
    return { map, buildMap }
  })[0]

  // Update folder map when folders change
  useEffect(() => {
    folderNames.map.clear()
    const buildMap = (items: any[]) => {
      for (const folder of items) {
        folderNames.map.set(folder.id, folder.name)
        if (folder.children) buildMap(folder.children)
      }
    }
    buildMap(folders)
  }, [folders])

  // Global keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setOpen])

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          selectNext()
          break
        case 'ArrowUp':
          e.preventDefault()
          selectPrevious()
          break
        case 'Enter':
          e.preventDefault()
          const selected = getSelectedResult()
          if (selected) {
            handleResultClick(selected)
          } else if (query.trim()) {
            // Perform search if no result selected
            performSearch(query, documents, folderNames.map)
          }
          break
        case 'Escape':
          setOpen(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, query, results, selectedIndex])

  // Handle search
  useEffect(() => {
    if (query.trim()) {
      const debounceTimer = setTimeout(() => {
        performSearch(query, documents, folderNames.map)
      }, 200)
      return () => clearTimeout(debounceTimer)
    } else {
      setSearchResults([])
    }
  }, [query])

  const handleResultClick = (result: any) => {
    addToRecentSearches(query)
    setOpen(false)
    clearSearch()
    navigate(`/editor/${result.id}`)
  }

  const handleRecentSearchClick = (recentQuery: string) => {
    setQuery(recentQuery)
    performSearch(recentQuery, documents, folderNames.map)
  }

  const handleClearRecent = () => {
    clearRecentSearches()
    toast.success('已清除搜索历史')
  }

  return (
    <>
      {trigger || (
        <Button
          variant="outline"
          className="relative w-64 justify-start text-sm text-muted-foreground"
          onClick={() => setOpen(true)}
        >
          <Search className="mr-2 h-4 w-4" />
          <span>搜索文档...</span>
          <kbd className="pointer-events-none absolute right-3 top-2.5 hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0">
          <DialogTitle className="sr-only">搜索文档</DialogTitle>
          <DialogDescription className="sr-only">搜索文档标题或内容</DialogDescription>
          <div className="flex items-center border-b border-border px-3">
            <Search className="h-4 w-4 shrink-0 opacity-50" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索文档标题或内容..."
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setQuery('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            <kbd className="pointer-events-none ml-2 hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-50 sm:flex">
              ESC
            </kbd>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : query && results.length > 0 ? (
              <div className="py-2">
                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  搜索结果 ({results.length})
                </div>
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    className={`flex w-full flex-col gap-1 px-3 py-2 text-left transition-colors ${
                      index === selectedIndex
                        ? 'bg-accent'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate font-medium">{result.title}</span>
                    </div>
                    {result.highlight && (
                      <p
                        className="ml-6 truncate text-sm text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: result.highlight }}
                      />
                    )}
                    {result.path && result.path !== result.title && (
                      <span className="ml-6 text-xs text-muted-foreground">
                        {result.path}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : query ? (
              <div className="flex flex-col items-center py-12 text-center">
                <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  没有找到与 "{query}" 相关的文档
                </p>
              </div>
            ) : recentSearches.length > 0 ? (
              <div className="py-2">
                <div className="flex items-center justify-between px-3 py-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    最近搜索
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={handleClearRecent}
                  >
                    清除
                  </Button>
                </div>
                {recentSearches.slice(0, 5).map((recentQuery) => (
                  <button
                    key={recentQuery}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50"
                    onClick={() => handleRecentSearchClick(recentQuery)}
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{recentQuery}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  输入关键词搜索文档
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  按 <kbd className="rounded border border-border bg-muted px-1">↑</kbd>
                  <kbd className="rounded border border-border bg-muted px-1">↓</kbd> 导航，
                  <kbd className="rounded border border-border bg-muted px-1">Enter</kbd> 打开
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
