import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import AppShell from '@/components/layout/AppShell'
import PageLoader from '@/components/ui/PageLoader'

// Lazy-loaded pages (will be built in future steps)
const LandingPage   = lazy(() => import('@/pages/LandingPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const StoriesPage   = lazy(() => import('@/pages/StoriesPage'))
const FamilyTreePage= lazy(() => import('@/pages/FamilyTreePage'))
const RecipesPage   = lazy(() => import('@/pages/RecipesPage'))
const BookPage      = lazy(() => import('@/pages/BookPage'))
const SettingsPage  = lazy(() => import('@/pages/SettingsPage'))
const AuthPage      = lazy(() => import('@/pages/AuthPage'))

// TODO: replace with real auth check in Step 2
const isAuthenticated = false

const App = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Public */}
      <Route path="/"     element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />

      {/* Protected — wrapped in AppShell */}
      <Route element={<AppShell><Navigate to="/dashboard" replace /></AppShell>}>
        {!isAuthenticated && (
          <Route path="/dashboard"   element={<Navigate to="/auth" replace />} />
        )}
      </Route>

      <Route
        path="/dashboard"
        element={
          <AppShell>
            <DashboardPage />
          </AppShell>
        }
      />
      <Route
        path="/stories/*"
        element={
          <AppShell>
            <StoriesPage />
          </AppShell>
        }
      />
      <Route
        path="/family-tree"
        element={
          <AppShell>
            <FamilyTreePage />
          </AppShell>
        }
      />
      <Route
        path="/recipes/*"
        element={
          <AppShell>
            <RecipesPage />
          </AppShell>
        }
      />
      <Route
        path="/book"
        element={
          <AppShell>
            <BookPage />
          </AppShell>
        }
      />
      <Route
        path="/settings"
        element={
          <AppShell>
            <SettingsPage />
          </AppShell>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
)

export default App
