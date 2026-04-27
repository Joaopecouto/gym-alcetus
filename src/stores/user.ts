import { create } from 'zustand'
import { api, ApiError } from '@/lib/api'
import type { User } from '@/types'

type Status = 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error'

interface UserState {
  status: Status
  user: User | null
  error: string | null
  bootstrap: () => Promise<void>
  setUser: (user: User | null) => void
  signOut: () => Promise<void>
}

export const useUser = create<UserState>((set) => ({
  status: 'idle',
  user: null,
  error: null,

  async bootstrap() {
    set({ status: 'loading', error: null })
    try {
      const user = await api.me()
      if (user) {
        set({ status: 'authenticated', user })
      } else {
        set({ status: 'unauthenticated', user: null })
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'unknown_error'
      set({ status: 'error', error: msg })
    }
  },

  setUser(user) {
    set(
      user
        ? { status: 'authenticated', user, error: null }
        : { status: 'unauthenticated', user: null, error: null },
    )
  },

  async signOut() {
    try {
      await api.logout()
    } finally {
      set({ status: 'unauthenticated', user: null })
    }
  },
}))
