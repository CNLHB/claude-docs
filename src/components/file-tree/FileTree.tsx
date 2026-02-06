import { Folder, File, MoreVertical, Plus, Trash2, Edit2 } from 'lucide-react'
import type { Folder as FolderType } from '@/types'
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
import { useDocumentStore } from '@/store/documentStore'
import { toast } from 'sonner'

interface FileTreeProps {
  folders: FolderType[]
  selectedFolder: string | null
  onFolderSelect: (folderId: string | null) => void
}

interface FolderNodeProps {
  folder: FolderType
  selectedFolder: string | null
  onFolderSelect: (folderId: string | null) => void
  level?: number
}

function FolderNode({ folder, selectedFolder, onFolderSelect, level = 0 }: FolderNodeProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [editName, setEditName] = useState(folder.name)
  const [newSubFolderName, setNewSubFolderName] = useState('')
  const updateFolder = useDocumentStore((state) => state.updateFolder)
  const deleteFolder = useDocumentStore((state) => state.deleteFolder)
  const createFolder = useDocumentStore((state) => state.createFolder)
  const toggleFolderExpanded = useDocumentStore((state) => state.toggleFolderExpanded)

  const hasChildren = folder.children && folder.children.length > 0
  const isSelected = selectedFolder === folder.id

  const handleRename = async () => {
    if (!editName.trim()) return
    try {
      await updateFolder({ id: folder.id, name: editName })
      setShowEditDialog(false)
      toast.success('文件夹重命名成功')
    } catch (error) {
      toast.error('重命名失败')
    }
  }

  const handleDelete = async () => {
    if (confirm(`确定要删除文件夹"${folder.name}"吗？其中的文档将会被移到根目录。`)) {
      try {
        await deleteFolder(folder.id)
        toast.success('文件夹删除成功')
      } catch (error) {
        toast.error('删除失败')
      }
    }
  }

  const handleCreateSubFolder = async () => {
    if (!newSubFolderName.trim()) return
    try {
      await createFolder({
        name: newSubFolderName,
        parent_id: folder.id,
      })
      setShowNewDialog(false)
      setNewSubFolderName('')
      // Expand parent folder
      toggleFolderExpanded(folder.id)
      toast.success('子文件夹创建成功')
    } catch (error) {
      toast.error('创建失败')
    }
  }

  return (
    <>
      <div
        className={`group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors ${
          isSelected
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={(e) => {
          e.stopPropagation()
          onFolderSelect(folder.id)
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleFolderExpanded(folder.id)
          }}
          className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted-foreground/20"
        >
          {hasChildren || folder.expanded ? (
            <ChevronDown
              className={`h-3 w-3 transition-transform ${folder.expanded ? '' : '-rotate-90'}`}
            />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>

        <Folder
          className={`h-4 w-4 ${isSelected ? 'fill-primary text-primary' : ''}`}
          style={{ color: folder.color }}
        />
        <span className="flex-1 truncate">{folder.name}</span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowNewDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              新建子文件夹
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
              <Edit2 className="mr-2 h-4 w-4" />
              重命名
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Render children if expanded */}
      {folder.expanded && hasChildren && (
        <div>
          {folder.children!.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              selectedFolder={selectedFolder}
              onFolderSelect={onFolderSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名文件夹</DialogTitle>
          </DialogHeader>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="文件夹名称"
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

      {/* New Sub Folder Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建子文件夹</DialogTitle>
          </DialogHeader>
          <Input
            value={newSubFolderName}
            onChange={(e) => setNewSubFolderName(e.target.value)}
            placeholder="文件夹名称"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreateSubFolder()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreateSubFolder}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Import Chevron icons
import { ChevronDown, ChevronRight } from 'lucide-react'

export function FileTree({ folders, selectedFolder, onFolderSelect }: FileTreeProps) {
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const createFolder = useDocumentStore((state) => state.createFolder)

  const handleCreateRootFolder = async () => {
    if (!newFolderName.trim()) return
    try {
      await createFolder({
        name: newFolderName,
      })
      setShowNewDialog(false)
      setNewFolderName('')
      toast.success('文件夹创建成功')
    } catch (error) {
      toast.error('创建失败')
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="font-semibold">文件夹</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setShowNewDialog(true)}
          title="新建文件夹"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* All Files */}
      <div
        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
          selectedFolder === null
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-muted/50'
        }`}
        onClick={() => onFolderSelect(null)}
      >
        <File className="h-4 w-4" />
        <span>全部文档</span>
      </div>

      {/* Folders */}
      <div className="flex-1 overflow-y-auto">
        {folders.map((folder) => (
          <FolderNode
            key={folder.id}
            folder={folder}
            selectedFolder={selectedFolder}
            onFolderSelect={onFolderSelect}
          />
        ))}
      </div>

      {/* New Folder Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建文件夹</DialogTitle>
          </DialogHeader>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="文件夹名称"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreateRootFolder()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreateRootFolder}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
