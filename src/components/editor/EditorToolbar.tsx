import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
  CheckSquare,
  Table,
  Eye,
  EyeOff,
} from 'lucide-react'

interface EditorToolbarProps {
  content: string
  onChange: (value: string) => void
  previewOpen: boolean
  onTogglePreview: () => void
}

export function EditorToolbar({
  content,
  onChange,
  previewOpen,
  onTogglePreview,
}: EditorToolbarProps) {
  const insertMarkdown = (before: string, after: string = '', placeholder = '') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const selectionEnd = textarea.selectionEnd
    const selectedText = content.substring(start, selectionEnd) || placeholder

    const newText =
      content.substring(0, start) + before + selectedText + after + content.substring(selectionEnd)

    onChange(newText)

    // Restore focus and set cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      )
    }, 0)
  }

  const insertLine = (prefix: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const lines = content.split('\n')

    // Find current line
    let currentLine = 0
    let charCount = 0
    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length + 1 // +1 for newline
      if (charCount + lineLength > start) {
        currentLine = i
        break
      }
      charCount += lineLength
    }

    lines[currentLine] = prefix + ' ' + lines[currentLine].replace(/^#+\s*/, '')
    onChange(lines.join('\n'))
  }

  return (
    <div className="flex items-center gap-1 border-b border-border bg-muted/40 p-2">
      {/* Headings */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => insertLine('###')}
        title="三级标题"
      >
        <Heading3 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => insertLine('##')}
        title="二级标题"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => insertLine('#')}
        title="一级标题"
      >
        <Heading1 className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Text formatting */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => insertMarkdown('**', '**', '粗体文本')}
        title="粗体"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => insertMarkdown('*', '*', '斜体文本')}
        title="斜体"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => insertMarkdown('~~', '~~', '删除线文本')}
        title="删除线"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => insertMarkdown('`', '`', '代码')}
        title="行内代码"
      >
        <Code className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Lists */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => insertLine('-')}
        title="无序列表"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => insertLine('1.')}
        title="有序列表"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => insertMarkdown('- [ ] ', '', '待办事项')}
        title="待办事项"
      >
        <CheckSquare className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Quote */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => insertLine('>')}
        title="引用"
      >
        <Quote className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Media & Links */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => insertMarkdown('[', '](url)', '链接文本')}
        title="链接"
      >
        <Link className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => insertMarkdown('![alt](', ')', '图片描述')}
        title="图片"
      >
        <Image className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          insertMarkdown(
            '\n| 列1 | 列2 | 列3 |\n|-----|-----|-----|\n|     |     |     |\n',
            '',
            ''
          )
        }
        title="表格"
      >
        <Table className="h-4 w-4" />
      </Button>

      <div className="flex-1" />

      {/* Toggle Preview */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onTogglePreview}
        title={previewOpen ? '隐藏预览' : '显示预览'}
      >
        {previewOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  )
}
