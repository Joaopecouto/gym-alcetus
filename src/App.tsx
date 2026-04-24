import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { HomeRoute } from '@/routes/Home'
import { LibraryRoute } from '@/routes/Library'
import { WorkoutsRoute } from '@/routes/Workouts'
import { HistoryRoute } from '@/routes/History'
import { ProgressRoute } from '@/routes/Progress'
import { NotFoundRoute } from '@/routes/NotFound'
import { OnboardingRoute } from '@/routes/onboarding/Onboarding'

function App() {
  return (
    <BrowserRouter>
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
        <Route path="/404" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
