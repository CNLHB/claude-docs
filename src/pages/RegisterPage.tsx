import { AuthLayout } from '@/components/auth/AuthLayout'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export function RegisterPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)

  useEffect(() => {
    if (user && !loading) {
      navigate('/')
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AuthLayout>
    )
  }

  return <AuthLayout><RegisterForm /></AuthLayout>
}
