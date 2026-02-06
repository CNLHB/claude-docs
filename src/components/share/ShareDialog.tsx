import { useState, useEffect } from 'react'
import { Link2, Copy, Check, EyeOff, Trash2 } from 'lucide-react'
import { shareService } from '@/services/supabase/shares'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface ShareDialogProps {
  documentId: string
  documentTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareDialog({ documentId, documentTitle, open, onOpenChange }: ShareDialogProps) {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasShare, setHasShare] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [viewCount, setViewCount] = useState(0)
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (open && documentId) {
      loadShare()
    }
  }, [open, documentId])

  const loadShare = async () => {
    const share = await shareService.getDocumentShare(documentId)
    if (share) {
      setHasShare(true)
      setShareUrl(shareService.getShareUrl(share.share_token))
      setViewCount(share.view_count || 0)
    } else {
      setHasShare(false)
    }
  }

  const handleCreateShare = async () => {
    setLoading(true)
    try {
      const share = await shareService.createShare({
        document_id: documentId,
        password: password || undefined,
        expires_at: null, // Never expire for now
      })

      if (share) {
        setHasShare(true)
        setShareUrl(shareService.getShareUrl(share.share_token))
        setViewCount(0)
        setPassword('')
        toast.success('分享链接已创建')
      }
    } catch (error) {
      toast.error('创建失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteShare = async () => {
    if (!confirm('确定要删除分享链接吗？')) return

    setLoading(true)
    try {
      const share = await shareService.getDocumentShare(documentId)
      if (share) {
        await shareService.deleteShare(share.id)
        setHasShare(false)
        setShareUrl('')
        setViewCount(0)
        toast.success('分享链接已删除')
      }
    } catch (error) {
      toast.error('删除失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('复制失败')
    }
  }

  const handleOpenShare = () => {
    window.open(shareUrl, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>分享文档</DialogTitle>
          <DialogDescription>
            分享 "{documentTitle}" 让其他人查看
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {hasShare ? (
            <>
              {/* Share URL */}
              <div className="space-y-2">
                <Label>分享链接</Label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="flex-1 text-sm"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleCopyLink}
                    title={copied ? '已复制' : '复制链接'}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleOpenShare}
                    title="打开链接"
                  >
                    <Link2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* View count */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">浏览次数</span>
                <span className="font-medium">{viewCount}</span>
              </div>

              {/* Delete share */}
              <Button
                variant="destructive"
                onClick={handleDeleteShare}
                disabled={loading}
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除分享链接
              </Button>
            </>
          ) : (
            <>
              {/* Create share form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">访问密码（可选）</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="留空表示公开访问"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="rounded-lg bg-muted p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <EyeOff className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="space-y-1 text-muted-foreground">
                      <p>• 有密码的分享需要输入密码才能访问</p>
                      <p>• 任何人拥有链接都可以访问已分享的文档</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleCreateShare}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? '创建中...' : '创建分享链接'}
                </Button>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
