import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const signOut = useAuthStore((state) => state.signOut)

  useEffect(() => {
    // Initialize auth on mount
    useAuthStore.getState().initialize()
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="rounded-md bg px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-lg border border-dashed p-12 text-center">
            <h2 className="mb-2 text-2xl font-semibold">欢迎来到 Claude Docs</h2>
            <p className="text-muted-foreground">
              编辑器功能即将上线...
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
