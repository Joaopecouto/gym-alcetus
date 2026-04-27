import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { HomeRoute } from '@/routes/Home'
import { LibraryRoute } from '@/routes/Library'
import { WorkoutsRoute } from '@/routes/Workouts'
import { HistoryRoute } from '@/routes/History'
import { ProgressRoute } from '@/routes/Progress'
import { NotFoundRoute } from '@/routes/NotFound'
import { OnboardingRoute } from '@/routes/onboarding/Onboarding'
import { LoginRoute } from '@/routes/Login'
import { useUser } from '@/stores/user'

function FullScreenLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

function AuthedRoutes() {
  const user = useUser((s) => s.user)
  const location = useLocation()

  if (!user) return <Navigate to="/login" replace />

  if (!user.onboardingCompleted && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }
  if (user.onboardingCompleted && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />
  }

  return (
    <Routes>
      <Route path="/onboarding" element={<OnboardingRoute />} />
      <Route element={<AppShell />}>
        <Route index element={<HomeRoute />} />
        <Route path="/library" element={<LibraryRoute />} />
        <Route path="/workouts" element={<WorkoutsRoute />} />
        <Route path="/history" element={<HistoryRoute />} />
        <Route path="/progress" element={<ProgressRoute />} />
        <Route path="*" element={<NotFoundRoute />} />
      </Route>
    </Routes>
  )
}

function App() {
  const status = useUser((s) => s.status)
  const bootstrap = useUser((s) => s.bootstrap)

  useEffect(() => {
    if (status === 'idle') {
      void bootstrap()
    }
  }, [status, bootstrap])

  if (status === 'idle' || status === 'loading') {
    return <FullScreenLoader />
  }

  return (
    <BrowserRouter>
      {status === 'unauthenticated' ? (
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <AuthedRoutes />
      )}
    </BrowserRouter>
  )
}

export default App
