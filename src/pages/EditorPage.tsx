import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDocumentStore } from '@/store/documentStore'
import { useUIStore } from '@/store/uiStore'
import { CodeMirrorEditor } from '@/components/editor/CodeMirrorEditor'
import { MarkdownPreview } from '@/components/editor/MarkdownPreview'
import { SplitView } from '@/components/editor/SplitView'
import { EditorToolbar } from '@/components/editor/EditorToolbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)

  const currentDocument = useDocumentStore((state) => state.currentDocument)
  const updateDocument = useDocumentStore((state) => state.updateDocument)
  const previewOpen = useUIStore((state) => state.previewOpen)
  const togglePreview = useUIStore((state) => state.togglePreview)

  // Load document
  useEffect(() => {
    if (currentDocument) {
      setContent(currentDocument.content || '')
      setTitle(currentDocument.title)
    }
  }, [currentDocument])

  // Handle content change
  const handleContentChange = useCallback((value: string) => {
    setContent(value)
    setHasChanges(true)
  }, [])

  // Auto save with debounce
  useEffect(() => {
    if (!hasChanges || !id) return

    const timer = setTimeout(async () => {
      await saveDocument(false)
    }, 2000) // 2 seconds debounce

    return () => clearTimeout(timer)
  }, [content, title, hasChanges, id])

  // Save document
  const saveDocument = async (showToast = true) => {
    if (!id || !hasChanges) return

    setSaving(true)
    try {
      await updateDocument(id, {
        title,
        content,
      })
      setHasChanges(false)
      if (showToast) {
        toast.success('保存成功')
      }
    } catch (error) {
      toast.error('保存失败')
      console.error('Save error:', error)
    } finally {
      setSaving(false)
    }
  }

  // Handle save button click
  const handleSave = () => {
    saveDocument(true)
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [content, title])

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])

  if (!currentDocument) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">加载文档中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            title="返回"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setHasChanges(true)
            }}
            className="h-8 w-64 border-none bg-transparent text-lg font-semibold focus-visible:ring-0"
            placeholder="文档标题"
          />
          {hasChanges && (
            <span className="text-xs text-muted-foreground">未保存</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            <Save className="mr-2 h-4 w-4" />
            保存
          </Button>
        </div>
      </header>

      {/* Toolbar */}
      <EditorToolbar
        content={content}
        onChange={handleContentChange}
        previewOpen={previewOpen}
        onTogglePreview={togglePreview}
      />

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        {previewOpen ? (
          <SplitView
            left={<CodeMirrorEditor content={content} onChange={handleContentChange} />}
            right={<MarkdownPreview content={content} />}
          />
        ) : (
          <CodeMirrorEditor content={content} onChange={handleContentChange} />
        )}
      </div>
    </div>
  )
}
