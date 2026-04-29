import { Navigate, Outlet } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import PageLoader from '@/components/ui/PageLoader'

const ProtectedRoute = () => {
  const { user, isAuthLoading } = useAppStore()

  if (isAuthLoading) return <PageLoader />
  if (!user)         return <Navigate to="/auth" replace />

  return <Outlet />
}

export default ProtectedRoute
