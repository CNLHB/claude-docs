import { ReactNode, useEffect } from 'react'
import { useNavigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { Button } from '@/components/ui/button'
import { LogOut, Menu, FileText, Settings, Home, Star } from 'lucide-react'

interface DashboardLayoutProps {
  children?: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const signOut = useAuthStore((state) => state.signOut)
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)

  useEffect(() => {
    // Initialize auth on mount
    useAuthStore.getState().initialize()
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r bg-card transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {sidebarOpen && (
            <span className="text-lg font-semibold">Claude Docs</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          <SidebarItem
            icon={<Home className="h-4 w-4" />}
            label="首页"
            collapsed={!sidebarOpen}
            onClick={() => navigate('/dashboard')}
          />
          <SidebarItem
            icon={<FileText className="h-4 w-4" />}
            label="文档"
            collapsed={!sidebarOpen}
            onClick={() => navigate('/documents')}
          />
          <SidebarItem
            icon={<Star className="h-4 w-4" />}
            label="收藏"
            collapsed={!sidebarOpen}
            onClick={() => navigate('/starred')}
          />
          <SidebarItem
            icon={<Settings className="h-4 w-4" />}
            label="设置"
            collapsed={!sidebarOpen}
            onClick={() => navigate('/settings')}
          />
        </nav>

        {/* User info */}
        <div className="border-t p-2">
          {sidebarOpen ? (
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user?.display_name || '用户'}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="h-8 w-8"
                title="退出登录"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-8 w-8"
              title="退出登录"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  )
}

interface SidebarItemProps {
  icon: ReactNode
  label: string
  collapsed: boolean
  onClick: () => void
}

function SidebarItem({ icon, label, collapsed, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </button>
  )
}
