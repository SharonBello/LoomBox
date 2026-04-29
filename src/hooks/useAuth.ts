import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { onAuthChange, signOut } from '@/services/authService'

// ============================================================
// useAuth — wires Firebase auth state into Zustand
// Mount this ONCE at the App level.
// ============================================================

export const useAuthInit = () => {
  const { setUser, setAuthLoading } = useAppStore()

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user)
      setAuthLoading(false)
    })
    return unsubscribe
  }, [setUser, setAuthLoading])
}

// ============================================================
// useSignOut — handles sign-out + redirect
// ============================================================

export const useSignOut = () => {
  const { setUser } = useAppStore()
  const navigate    = useNavigate()

  return async () => {
    await signOut()
    setUser(null)
    navigate('/', { replace: true })
  }
}
