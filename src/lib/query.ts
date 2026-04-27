import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export const queryKeys = {
  user: ['user'] as const,
  muscleGroups: ['muscle-groups'] as const,
  exercises: ['exercises'] as const,
  workouts: ['workouts'] as const,
  workout: (id: string) => ['workout', id] as const,
  workoutTemplates: ['workout-templates'] as const,
  sessions: ['sessions'] as const,
  session: (id: string) => ['session', id] as const,
  plans: ['plans'] as const,
  plan: (id: string) => ['plan', id] as const,
  measurements: ['measurements'] as const,
}
