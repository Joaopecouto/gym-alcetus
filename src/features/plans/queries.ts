import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query'
import type { PlanInput } from '@/types'

export function usePlans() {
  return useQuery({
    queryKey: queryKeys.plans,
    queryFn: () => api.listPlans(),
  })
}

export function useActivePlan() {
  const q = usePlans()
  return {
    ...q,
    data: q.data?.find((p) => p.isActive) ?? null,
  }
}

export function usePlan(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.plan(id) : ['plan', 'none'],
    queryFn: () => api.getPlan(id!),
    enabled: !!id,
  })
}

export function useCreatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: PlanInput) => api.createPlan(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.plans })
    },
  })
}

export function useUpdatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PlanInput }) =>
      api.updatePlan(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.plans })
      qc.invalidateQueries({ queryKey: queryKeys.plan(vars.id) })
    },
  })
}

export function useActivatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.activatePlan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.plans })
    },
  })
}

export function useDeletePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deletePlan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.plans })
    },
  })
}
