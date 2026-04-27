import type {
  Exercise,
  MuscleGroup,
  OnboardingPayload,
  Session,
  SessionWithSets,
  User,
  WorkoutWithExercises,
} from '@/types'

export class ApiError extends Error {
  status: number
  payload?: unknown
  constructor(status: number, message: string, payload?: unknown) {
    super(message)
    this.status = status
    this.payload = payload
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })

  if (!res.ok) {
    let payload: unknown
    try {
      payload = await res.json()
    } catch {
      payload = await res.text()
    }
    throw new ApiError(res.status, `${init.method ?? 'GET'} ${path} → ${res.status}`, payload)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const api = {
  // ----- auth -----
  loginWithGoogle(idToken: string) {
    return request<{ ok: true }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential: idToken }),
    })
  },
  logout() {
    return request<{ ok: true }>('/api/auth/logout', { method: 'POST' })
  },

  // ----- me -----
  async me(): Promise<User | null> {
    try {
      const { user } = await request<{ user: User }>('/api/me')
      return user
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return null
      throw err
    }
  },
  async saveOnboarding(payload: OnboardingPayload): Promise<User> {
    const { user } = await request<{ user: User }>('/api/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    return user
  },

  // ----- catalog -----
  async listMuscleGroups(): Promise<MuscleGroup[]> {
    const { muscleGroups } = await request<{ muscleGroups: MuscleGroup[] }>(
      '/api/muscle-groups',
    )
    return muscleGroups
  },
  async listExercises(): Promise<Exercise[]> {
    const { exercises } = await request<{ exercises: Exercise[] }>(
      '/api/exercises',
    )
    return exercises
  },
  async createCustomExercise(
    payload: Omit<Exercise, 'id' | 'ownerId' | 'isCustom' | 'isFavorite' | 'createdAt'>,
  ): Promise<Exercise> {
    const { exercise } = await request<{ exercise: Exercise }>(
      '/api/exercises',
      { method: 'POST', body: JSON.stringify(payload) },
    )
    return exercise
  },
  deleteExercise(id: string) {
    return request<{ ok: true }>(`/api/exercises/${id}`, { method: 'DELETE' })
  },
  toggleFavorite(id: string) {
    return request<{ isFavorite: boolean }>(
      `/api/exercises/${id}/favorite`,
      { method: 'POST' },
    )
  },

  // ----- workouts -----
  async listWorkouts(): Promise<WorkoutWithExercises[]> {
    const { workouts } = await request<{ workouts: WorkoutWithExercises[] }>(
      '/api/workouts',
    )
    return workouts
  },
  async getWorkout(id: string): Promise<WorkoutWithExercises> {
    const { workout } = await request<{ workout: WorkoutWithExercises }>(
      `/api/workouts/${id}`,
    )
    return workout
  },

  // ----- sessions -----
  async listSessions(): Promise<Session[]> {
    const { sessions } = await request<{ sessions: Session[] }>(
      '/api/sessions',
    )
    return sessions
  },
  async getSession(id: string): Promise<SessionWithSets> {
    const { session } = await request<{ session: SessionWithSets }>(
      `/api/sessions/${id}`,
    )
    return session
  },
}
