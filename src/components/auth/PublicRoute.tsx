import { ReactNode, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

interface PublicRouteProps {
  children: ReactNode
  redirectTo?: string
}

export function PublicRoute({ children, redirectTo = '/dashboard' }: PublicRouteProps) {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)

  useEffect(() => {
    if (!loading && user) {
      navigate(redirectTo, { replace: true })
    }
  }, [user, loading, navigate, redirectTo])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (user) {
    return null
  }

  return <>{children}</>
}
