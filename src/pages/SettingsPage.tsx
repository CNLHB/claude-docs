import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Keyboard,
  Moon,
  Sun,
  Monitor,
  LogOut,
  User,
  Bell,
  Palette,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatShortcut, commonShortcuts } from '@/hooks/useKeyboardShortcuts'

export function SettingsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const signOut = useAuthStore((state) => state.signOut)

  // UI store
  const theme = useUIStore((state) => state.theme)
  const setTheme = useUIStore((state) => state.setTheme)
  const editorFontSize = useUIStore((state) => state.editorFontSize)
  const setEditorFontSize = useUIStore((state) => state.setEditorFontSize)

  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [displayName, setDisplayName] = useState(user?.display_name || '')

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '')
    }
  }, [user])

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
      toast.success('已退出登录')
    } catch (error) {
      toast.error('退出失败')
    }
  }

  const handleSaveProfile = async () => {
    toast.info('功能开发中')
  }

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    toast.success('主题已更新')
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-8 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">设置</h1>
          <p className="text-muted-foreground mt-2">
            管理您的账户和偏好设置
          </p>
        </div>

        {/* Profile Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <h2 className="text-xl font-semibold">个人资料</h2>
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-card p-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" value={user?.email || ''} disabled className="max-w-md" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">显示名称</Label>
              <div className="flex gap-2 max-w-md">
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="输入显示名称"
                />
                <Button onClick={handleSaveProfile}>保存</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <h2 className="text-xl font-semibold">外观</h2>
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>主题</Label>
                <p className="text-sm text-muted-foreground">
                  选择应用的外观主题
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => handleThemeChange('light')}
                  title="浅色主题"
                >
                  <Sun className="h-5 w-5" />
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => handleThemeChange('dark')}
                  title="深色主题"
                >
                  <Moon className="h-5 w-5" />
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => handleThemeChange('system')}
                  title="跟随系统"
                >
                  <Monitor className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="fontSize">编辑器字体大小</Label>
                <p className="text-sm text-muted-foreground">
                  当前: {editorFontSize}px
                </p>
              </div>
              <select
                id="fontSize"
                value={editorFontSize}
                onChange={(e) => setEditorFontSize(parseInt(e.target.value))}
                className="w-32 rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="12">12px</option>
                <option value="14">14px</option>
                <option value="16">16px</option>
                <option value="18">18px</option>
                <option value="20">20px</option>
              </select>
            </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h2 className="text-xl font-semibold">通知</h2>
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">桌面通知</Label>
                <p className="text-sm text-muted-foreground">
                  接收文档更新和分享通知
                </p>
              </div>
              <input
                type="checkbox"
                id="notifications"
                defaultChecked={true}
                className="h-5 w-5 rounded border-border"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sounds">提示音</Label>
                <p className="text-sm text-muted-foreground">
                  操作时播放音效
                </p>
              </div>
              <input
                type="checkbox"
                id="sounds"
                className="h-5 w-5 rounded border-border"
              />
            </div>
          </div>
        </section>

        {/* Keyboard Shortcuts Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              <h2 className="text-xl font-semibold">键盘快捷键</h2>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowKeyboardShortcuts(true)}
            >
              查看全部
            </Button>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {commonShortcuts.map((category) => (
                <div key={category.name}>
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                    {category.name}
                  </h4>
                  <div className="space-y-1">
                    {category.shortcuts.slice(0, 4).map((shortcut) => (
                      <div
                        key={shortcut.key}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {shortcut.description}
                        </span>
                        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-mono">
                          {formatShortcut(shortcut.key)}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Account Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <h2 className="text-xl font-semibold">账户</h2>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm">
                  已登录为 <span className="font-medium">{user?.email}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  成员 since: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="w-full sm:w-auto"
              >
                <LogOut className="mr-2 h-4 w-4" />
                退出登录
              </Button>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">关于</h2>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="space-y-2 text-sm">
              <p>Claude Docs - 功能完善的在线 Markdown 文档编辑器</p>
              <p className="text-muted-foreground">
                版本: 1.0.0
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={showKeyboardShortcuts} onOpenChange={setShowKeyboardShortcuts}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>键盘快捷键</DialogTitle>
            <DialogDescription>
              提高您的工作效率
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {commonShortcuts.map((category) => (
              <div key={category.name}>
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                  {category.name}
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {category.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.key}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{shortcut.description}</span>
                      <kbd className="rounded border border-border bg-muted px-2 py-1 text-xs font-mono">
                        {formatShortcut(shortcut.key)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
