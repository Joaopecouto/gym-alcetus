import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query'
import type { Exercise } from '@/types'

export function useMuscleGroups() {
  return useQuery({
    queryKey: queryKeys.muscleGroups,
    queryFn: () => api.listMuscleGroups(),
    staleTime: 5 * 60_000, // raramente muda
  })
}

export function useExercises() {
  return useQuery({
    queryKey: queryKeys.exercises,
    queryFn: () => api.listExercises(),
  })
}

export function useToggleFavorite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.toggleFavorite(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.exercises })
      const prev = qc.getQueryData<Exercise[]>(queryKeys.exercises)
      if (prev) {
        qc.setQueryData<Exercise[]>(
          queryKeys.exercises,
          prev.map((e) =>
            e.id === id ? { ...e, isFavorite: !e.isFavorite } : e,
          ),
        )
      }
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.exercises, ctx.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.exercises })
    },
  })
}

export function useCreateCustomExercise() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createCustomExercise,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.exercises })
    },
  })
}

export function useDeleteExercise() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteExercise(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.exercises })
    },
  })
}
