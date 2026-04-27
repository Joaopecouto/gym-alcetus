import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { HomeRoute } from '@/routes/Home'
import { LibraryRoute } from '@/routes/Library'
import { ExerciseDetailRoute } from '@/routes/ExerciseDetail'
import { ExerciseNewRoute } from '@/routes/ExerciseNew'
import { WorkoutsRoute } from '@/routes/Workouts'
import { WorkoutDetailRoute } from '@/routes/WorkoutDetail'
import { WorkoutEditorRoute } from '@/routes/WorkoutEditor'
import { PlansRoute } from '@/routes/Plans'
import { PlanEditorRoute } from '@/routes/PlanEditor'
import { HistoryRoute } from '@/routes/History'
import { SessionDetailRoute } from '@/routes/SessionDetail'
import { SessionExecuteRoute } from '@/routes/SessionExecute'
import { ProgressRoute } from '@/routes/Progress'
import { SettingsRoute } from '@/routes/Settings'
import { ProfileEditRoute } from '@/routes/ProfileEdit'
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
      {/* Se já tá logado e abriu /login (cache do PWA, link velho, refresh
          após autenticar), manda pra home. Se não tiver isso, /login cai no
          catch-all e mostra 404. */}
      <Route path="/login" element={<Navigate to="/" replace />} />

      <Route path="/onboarding" element={<OnboardingRoute />} />

      {/* Rotas fullscreen (sem tab bar) */}
      <Route path="/library/new" element={<ExerciseNewRoute />} />
      <Route path="/library/:id" element={<ExerciseDetailRoute />} />
      <Route path="/workouts/new" element={<WorkoutEditorRoute />} />
      <Route path="/workouts/:id/edit" element={<WorkoutEditorRoute />} />
      <Route path="/workouts/:id" element={<WorkoutDetailRoute />} />
      <Route path="/plans" element={<PlansRoute />} />
      <Route path="/plans/new" element={<PlanEditorRoute />} />
      <Route path="/plans/:id" element={<PlanEditorRoute />} />
      <Route path="/history/:id" element={<SessionDetailRoute />} />
      <Route path="/session/:id" element={<SessionExecuteRoute />} />
      <Route path="/settings" element={<SettingsRoute />} />
      <Route path="/settings/profile" element={<ProfileEditRoute />} />

      {/* Rotas com tab bar */}
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
