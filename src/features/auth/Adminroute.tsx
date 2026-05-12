import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { CircularProgress } from '@mui/material'
import { useAppStore } from '@/store/appStore'
import { adminService } from '@/services/AdminService'

interface Props { children: React.ReactNode }

const AdminRoute = ({ children }: Props) => {
  const { user } = useAppStore()
  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!user) { setChecking(false); return }
    adminService.isAdmin(user.uid)
      .then(result => setIsAdmin(result))
      .finally(() => setChecking(false))
  }, [user])

  if (!user) return <Navigate to="/auth" replace />
  if (checking) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <CircularProgress sx={{ color: '#c9954a' }} />
    </div>
  )
  if (!isAdmin) return <Navigate to="/dashboard" replace />

  return <>{children}</>
}

export default AdminRoute