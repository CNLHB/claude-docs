import { useState, useEffect } from 'react'
import { X, Plus, Tag as TagIcon } from 'lucide-react'
import { useTagStore } from '@/store/tagStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

interface TagSelectorProps {
  documentId: string
  selectedTags: string[]
  onTagsChange: (tagIds: string[]) => void
}

export function TagSelector({ documentId, selectedTags, onTagsChange }: TagSelectorProps) {
  const { tags, loading, createTag, fetchTags } = useTagStore()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [newTagName, setNewTagName] = useState('')

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  const selectedTagObjects = tags.filter((tag) => selectedTags.includes(tag.id))
  const availableTags = tags.filter(
    (tag) => !selectedTags.includes(tag.id) && tag.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTags.filter((id) => id !== tagId))
  }

  const handleAddTag = (tagId: string) => {
    onTagsChange([...selectedTags, tagId])
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    const newTag = await createTag({ name: newTagName.trim() })
    if (newTag) {
      handleAddTag(newTag.id)
      setNewTagName('')
      setSearch('')
    }
  }

  return (
    <div className="space-y-2">
      <Label>标签</Label>

      {/* Selected Tags */}
      <div className="flex flex-wrap gap-2 min-h-[36px] p-2 rounded-md border border-border bg-background">
        {selectedTagObjects.length === 0 ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3 w-3" />
            添加标签
          </button>
        ) : (
          selectedTagObjects.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="gap-1 pl-2 pr-1"
              style={{ backgroundColor: tag.color + '20', borderColor: tag.color }}
            >
              <TagIcon className="h-3 w-3" style={{ color: tag.color }} />
              {tag.name}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag.id)}
                className="ml-1 rounded-full hover:bg-background/50 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}

        {selectedTagObjects.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Tag Selection Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>选择标签</DialogTitle>
            <DialogDescription>
              为文档选择或创建标签
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Search Input */}
            <div className="space-y-2">
              <Label htmlFor="search">搜索标签</Label>
              <Input
                id="search"
                placeholder="输入标签名称搜索..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            {/* Available Tags */}
            <div className="space-y-2">
              <Label>可用标签</Label>
              <div className="max-h-48 overflow-y-auto space-y-1 rounded-md border border-border">
                {loading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    加载中...
                  </div>
                ) : availableTags.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {search ? '未找到匹配的标签' : '没有可用的标签'}
                  </div>
                ) : (
                  availableTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleAddTag(tag.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors text-left"
                    >
                      <TagIcon className="h-4 w-4 flex-shrink-0" style={{ color: tag.color }} />
                      <span className="flex-1 truncate">{tag.name}</span>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Create New Tag */}
            <div className="space-y-2">
              <Label htmlFor="newTag">创建新标签</Label>
              <div className="flex gap-2">
                <Input
                  id="newTag"
                  placeholder="新标签名称"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleCreateTag()
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim()}
                  size="icon"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
