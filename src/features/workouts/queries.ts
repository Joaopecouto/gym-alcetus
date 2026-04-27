import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query'
import type { WorkoutInput } from '@/types'

export function useWorkouts() {
  return useQuery({
    queryKey: queryKeys.workouts,
    queryFn: () => api.listWorkouts(),
  })
}

export function useWorkout(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.workout(id) : ['workout', 'none'],
    queryFn: () => api.getWorkout(id!),
    enabled: !!id,
  })
}

export function useWorkoutTemplates() {
  return useQuery({
    queryKey: queryKeys.workoutTemplates,
    queryFn: () => api.listWorkoutTemplates(),
    staleTime: 5 * 60_000,
  })
}

export function useCreateWorkout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: WorkoutInput) => api.createWorkout(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workouts })
    },
  })
}

export function useUpdateWorkout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: WorkoutInput }) =>
      api.updateWorkout(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.workouts })
      qc.invalidateQueries({ queryKey: queryKeys.workout(vars.id) })
    },
  })
}

export function useDeleteWorkout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteWorkout(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workouts })
    },
  })
}
