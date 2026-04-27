import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query'

export function useSessions() {
  return useQuery({
    queryKey: queryKeys.sessions,
    queryFn: () => api.listSessions(),
  })
}

export function useSession(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.session(id) : ['session', 'none'],
    queryFn: () => api.getSession(id!),
    enabled: !!id,
  })
}
