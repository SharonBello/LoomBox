import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import AppShell from '@/components/layout/AppShell'
import PageLoader from '@/components/ui/PageLoader'
import ProtectedRoute from '@/features/auth/ProtectedRoute'
import { useAuthInit } from '@/hooks/useAuth'
import StoryEditor from '@/features/story/StoryEditor'

const LandingPage    = lazy(() => import('@/pages/LandingPage'))
const AuthPage       = lazy(() => import('@/pages/AuthPage'))
const DashboardPage  = lazy(() => import('@/pages/DashboardPage'))
const StoriesPage    = lazy(() => import('@/pages/StoriesPage'))
const StoryPage      = lazy(() => import('@/pages/StoryPage'))
const FamilyTreePage = lazy(() => import('@/pages/FamilyTreePage'))
const RecipesPage    = lazy(() => import('@/pages/RecipesPage'))
const BookPage       = lazy(() => import('@/pages/BookPage'))
const SettingsPage   = lazy(() => import('@/pages/SettingsPage'))

const Shell = ({ children }: { children: React.ReactNode }) => (
  <AppShell>{children}</AppShell>
)

const App = () => {
  useAuthInit()

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* Public */}
        <Route path="/"     element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard"   element={<Shell><DashboardPage /></Shell>} />
          <Route path="/stories"     element={<Shell><StoriesPage /></Shell>} />
          <Route path="/stories/new" element={<Shell><StoryEditor /></Shell>} />
          <Route path="/stories/:id" element={<Shell><StoryPage /></Shell>} />
          <Route path="/family-tree" element={<Shell><FamilyTreePage /></Shell>} />
          <Route path="/recipes"     element={<Shell><RecipesPage /></Shell>} />
          <Route path="/recipes/new" element={<Shell><RecipesPage /></Shell>} />
          <Route path="/book"        element={<Shell><BookPage /></Shell>} />
          <Route path="/settings"    element={<Shell><SettingsPage /></Shell>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
