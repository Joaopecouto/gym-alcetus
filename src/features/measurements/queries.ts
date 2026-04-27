import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query'
import type { MeasurementInput } from '@/types'

export function useMeasurements() {
  return useQuery({
    queryKey: queryKeys.measurements,
    queryFn: () => api.listMeasurements(),
  })
}

export function useCreateMeasurement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: MeasurementInput) => api.createMeasurement(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.measurements })
      // user.weightKg também é atualizado server-side
      qc.invalidateQueries({ queryKey: queryKeys.user })
    },
  })
}

export function useDeleteMeasurement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteMeasurement(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.measurements })
    },
  })
}
