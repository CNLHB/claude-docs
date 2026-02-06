import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  File,
  Star,
  StarOff,
  MoreVertical,
  Trash2,
  Archive,
  Edit2,
  FolderOpen,
} from 'lucide-react'
import type { Document as DocumentType } from '@/types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDocumentStore } from '@/store/documentStore'
import { toast } from 'sonner'
import type { ViewMode } from '@/types'

interface FileListProps {
  documents: DocumentType[]
  viewMode: ViewMode
  folderName?: string
}

function DocumentItem({ document, viewMode }: { document: DocumentType; viewMode: ViewMode }) {
  const navigate = useNavigate()
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editTitle, setEditTitle] = useState(document.title)
  const updateDocument = useDocumentStore((state) => state.updateDocument)
  const deleteDocument = useDocumentStore((state) => state.deleteDocument)
  const toggleStarDocument = useDocumentStore((state) => state.toggleStarDocument)
  const toggleArchiveDocument = useDocumentStore((state) => state.toggleArchiveDocument)

  const handleRename = async () => {
    if (!editTitle.trim()) return
    try {
      await updateDocument({ id: document.id, title: editTitle })
      setShowEditDialog(false)
      toast.success('文档重命名成功')
    } catch (error) {
      toast.error('重命名失败')
    }
  }

  const handleDelete = async () => {
    if (confirm(`确定要删除文档"${document.title}"吗？`)) {
      try {
        await deleteDocument(document.id)
        toast.success('文档删除成功')
      } catch (error) {
        toast.error('删除失败')
      }
    }
  }

  const handleToggleStar = async () => {
    try {
      await toggleStarDocument(document.id)
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleToggleArchive = async () => {
    if (confirm(`确定要${document.is_archived ? '取消归档' : '归档'}文档"${document.title}"吗？`)) {
      try {
        await toggleArchiveDocument(document.id)
        toast.success(document.is_archived ? '文档已取消归档' : '文档已归档')
      } catch (error) {
        toast.error('操作失败')
      }
    }
  }

  const getPreviewText = () => {
    const lines = document.content.split('\n').filter((line) => line.trim())
    return lines[0] || '无内容'
  }

  if (viewMode === 'grid') {
    return (
      <>
        <div
          className="group relative flex cursor-pointer flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent"
          onClick={() => navigate(`/editor/${document.id}`)}
        >
          <div className="mb-3 flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <File className="h-5 w-5 text-primary" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={handleToggleStar}>
                  {document.is_starred ? (
                    <>
                      <StarOff className="mr-2 h-4 w-4" />
                      取消星标
                    </>
                  ) : (
                    <>
                      <Star className="mr-2 h-4 w-4" />
                      添加星标
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  重命名
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleToggleArchive}>
                  <Archive className="mr-2 h-4 w-4" />
                  归档
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <h3 className="mb-1 truncate font-semibold">{document.title}</h3>
          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
            {getPreviewText()}
          </p>

          <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {formatDistanceToNow(new Date(document.updated_at), {
                addSuffix: true,
                locale: zhCN,
              })}
            </span>
            {document.is_starred && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle>重命名文档</DialogTitle>
            </DialogHeader>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="文档标题"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                取消
              </Button>
              <Button onClick={handleRename}>确定</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // List view
  return (
    <>
      <div
        className="group flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent"
        onClick={() => navigate(`/editor/${document.id}`)}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
          <File className="h-4 w-4 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-medium">{document.title}</h3>
            {document.is_starred && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
          </div>
          <p className="truncate text-sm text-muted-foreground">{getPreviewText()}</p>
        </div>

        <div className="hidden text-sm text-muted-foreground sm:block">
          {formatDistanceToNow(new Date(document.updated_at), {
            addSuffix: true,
            locale: zhCN,
          })}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={handleToggleStar}>
              {document.is_starred ? (
                <>
                  <StarOff className="mr-2 h-4 w-4" />
                  取消星标
                </>
              ) : (
                <>
                  <Star className="mr-2 h-4 w-4" />
                  添加星标
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
              <Edit2 className="mr-2 h-4 w-4" />
              重命名
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleToggleArchive}>
              <Archive className="mr-2 h-4 w-4" />
              归档
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>重命名文档</DialogTitle>
          </DialogHeader>
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="文档标题"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              取消
            </Button>
            <Button onClick={handleRename}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function FileList({ documents, viewMode, folderName }: FileListProps) {
  const navigate = useNavigate()
  const createDocument = useDocumentStore((state) => state.createDocument)
  const selectedFolder = useDocumentStore((state) => state.selectedFolder)

  const [showNewDialog, setShowNewDialog] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState('')

  const handleCreateDocument = async () => {
    if (!newDocTitle.trim()) return
    try {
      const doc = await createDocument({
        title: newDocTitle,
        content: '',
        folder_id: selectedFolder,
      })
      if (doc) {
        setShowNewDialog(false)
        setNewDocTitle('')
        navigate(`/editor/${doc.id}`)
        toast.success('文档创建成功')
      }
    } catch (error) {
      toast.error('创建失败')
    }
  }

  if (documents.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <FolderOpen className="mb-4 h-16 w-16 text-muted-foreground/50" />
        <h3 className="mb-2 text-lg font-semibold">暂无文档</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          {folderName ? `文件夹"${folderName}"为空` : '开始创建你的第一个文档吧'}
        </p>
        <Button onClick={() => setShowNewDialog(true)}>
          <File className="mr-2 h-4 w-4" />
          新建文档
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-2'}>
        {documents.map((doc) => (
          <DocumentItem key={doc.id} document={doc} viewMode={viewMode} />
        ))}
      </div>

      {/* New Document Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建文档</DialogTitle>
          </DialogHeader>
          <Input
            value={newDocTitle}
            onChange={(e) => setNewDocTitle(e.target.value)}
            placeholder="文档标题"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreateDocument()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreateDocument}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
