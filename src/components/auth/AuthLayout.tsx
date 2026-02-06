import { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Claude Docs
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            功能完善的在线 Markdown 文档编辑器
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
