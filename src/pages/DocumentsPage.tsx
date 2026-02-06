import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDocumentStore } from '@/store/documentStore'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileTree } from '@/components/file-tree/FileTree'
import { FileList } from '@/components/file-tree/FileList'
import { ViewToggle } from '@/components/file-tree/ViewToggle'
import { Plus, File, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

export function DocumentsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  // Document store
  const {
    documents,
    folders,
    selectedFolder,
    loading,
    fetchDocuments,
    fetchFolders,
    setSelectedFolder,
  } = useDocumentStore()

  // UI store
  const { sidebarOpen, setSidebarOpen, viewMode, setViewMode, sortBy, setSortBy } = useUIStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState('')

  useEffect(() => {
    if (user) {
      fetchDocuments()
      fetchFolders()
    }
  }, [user, fetchDocuments, fetchFolders, selectedFolder])

  // Fetch documents when folder changes
  useEffect(() => {
    if (user) {
      fetchDocuments(selectedFolder ?? undefined)
    }
  }, [selectedFolder, user, fetchDocuments])

  // Sort and filter documents
  const filteredDocuments = useMemo(() => {
    let result = [...documents]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (doc) =>
          doc.title.toLowerCase().includes(query) ||
          doc.content.toLowerCase().includes(query)
      )
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title, 'zh-CN')
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'modified':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      }
    })

    return result
  }, [documents, searchQuery, sortBy])

  // Get current folder name
  const currentFolderName = useMemo(() => {
    if (!selectedFolder) return null
    const findFolder = (folders: any[], id: string): string | null => {
      for (const folder of folders) {
        if (folder.id === id) return folder.name
        if (folder.children) {
          const found = findFolder(folder.children, id)
          if (found) return found
        }
      }
      return null
    }
    return findFolder(folders, selectedFolder)
  }, [selectedFolder, folders])

  const handleCreateDocument = async () => {
    if (!newDocTitle.trim()) return
    try {
      const newDoc = await createDocument({
        title: newDocTitle,
        content: '',
        folder_id: selectedFolder,
      })
      if (newDoc) {
        setShowNewDialog(false)
        setNewDocTitle('')
        navigate(`/editor/${newDoc.id}`)
        toast.success('文档创建成功')
      }
    } catch (error) {
      toast.error('创建失败')
    }
  }

  const createDocument = useDocumentStore((state) => state.createDocument)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - File Tree */}
      <aside
        className={`border-r border-border bg-card transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-0'
        }`}
      >
        {sidebarOpen && (
          <div className="flex h-full flex-col">
            <FileTree
              folders={folders}
              selectedFolder={selectedFolder}
              onFolderSelect={setSelectedFolder}
            />
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <File className="h-5 w-5" />
            </Button>

            {currentFolderName && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">文件夹:</span>
                <span className="font-medium">{currentFolderName}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => setSelectedFolder(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Input
                type="text"
                placeholder="搜索文档..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* View Toggle */}
            <ViewToggle
              viewMode={viewMode}
              onViewChange={setViewMode}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />

            {/* New Document Button */}
            <Button onClick={() => setShowNewDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              新建
            </Button>
          </div>
        </header>

        {/* Documents List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <FileList
              documents={filteredDocuments}
              viewMode={viewMode}
              folderName={currentFolderName ?? undefined}
            />
          )}
        </div>
      </main>

      {/* New Document Dialog */}
      {showNewDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">新建文档</h2>
            <Input
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              placeholder="文档标题"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateDocument()}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                取消
              </Button>
              <Button onClick={handleCreateDocument}>确定</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
