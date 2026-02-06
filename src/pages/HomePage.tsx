import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export function HomePage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)

  useEffect(() => {
    if (!loading) {
      if (user) {
        navigate('/dashboard')
      } else {
        navigate('/login')
      }
    }
  }, [user, loading, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}
