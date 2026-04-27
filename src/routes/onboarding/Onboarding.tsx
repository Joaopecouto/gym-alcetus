import { useEffect, useState } from 'react'
import { OnboardingWizard } from '@/features/onboarding/OnboardingWizard'
import { api } from '@/lib/api'
import { useUser } from '@/stores/user'
import type { MuscleGroup } from '@/types'

export function OnboardingRoute() {
  const user = useUser((s) => s.user)
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api
      .listMuscleGroups()
      .then((data) => {
        if (!cancelled) setMuscleGroups(data)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-destructive">
        Erro ao carregar: {error}
      </div>
    )
  }

  if (!user || !muscleGroups) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <OnboardingWizard
      initialName={user.name}
      muscleGroups={muscleGroups}
    />
  )
}
