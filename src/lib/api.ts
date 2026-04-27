import type {
  BodyMeasurement,
  Exercise,
  MeasurementInput,
  MuscleGroup,
  OnboardingPayload,
  Plan,
  PlanInput,
  Session,
  SessionWithSets,
  User,
  WorkoutInput,
  WorkoutTemplate,
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
  async createWorkout(payload: WorkoutInput): Promise<WorkoutWithExercises> {
    const { workout } = await request<{ workout: WorkoutWithExercises }>(
      '/api/workouts',
      { method: 'POST', body: JSON.stringify(payload) },
    )
    return workout
  },
  async updateWorkout(id: string, payload: WorkoutInput) {
    const { workout } = await request<{ workout: WorkoutWithExercises }>(
      `/api/workouts/${id}`,
      { method: 'PUT', body: JSON.stringify(payload) },
    )
    return workout
  },
  deleteWorkout(id: string) {
    return request<{ ok: true }>(`/api/workouts/${id}`, { method: 'DELETE' })
  },
  async listWorkoutTemplates(): Promise<WorkoutTemplate[]> {
    const { templates } = await request<{ templates: WorkoutTemplate[] }>(
      '/api/workout-templates',
    )
    return templates
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
  async startSession(workoutId: string, planId?: string | null): Promise<string> {
    const { id } = await request<{ id: string }>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ workoutId, planId }),
    })
    return id
  },
  finishSession(id: string, payload: FinishSessionPayload) {
    return request<{ ok: true }>(`/api/sessions/${id}/finish`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },
  deleteSession(id: string) {
    return request<{ ok: true }>(`/api/sessions/${id}`, { method: 'DELETE' })
  },

  // ----- plans -----
  async listPlans(): Promise<Plan[]> {
    const { plans } = await request<{ plans: Plan[] }>('/api/plans')
    return plans
  },
  async getPlan(id: string): Promise<Plan> {
    const { plan } = await request<{ plan: Plan }>(`/api/plans/${id}`)
    return plan
  },
  async createPlan(payload: PlanInput): Promise<Plan> {
    const { plan } = await request<{ plan: Plan }>('/api/plans', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return plan
  },
  async updatePlan(id: string, payload: PlanInput): Promise<Plan> {
    const { plan } = await request<{ plan: Plan }>(`/api/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    return plan
  },
  activatePlan(id: string) {
    return request<{ ok: true }>(`/api/plans/${id}/activate`, {
      method: 'POST',
    })
  },
  deletePlan(id: string) {
    return request<{ ok: true }>(`/api/plans/${id}`, { method: 'DELETE' })
  },

  // ----- measurements -----
  async listMeasurements(): Promise<BodyMeasurement[]> {
    const { measurements } = await request<{ measurements: BodyMeasurement[] }>(
      '/api/measurements',
    )
    return measurements
  },
  async createMeasurement(payload: MeasurementInput): Promise<BodyMeasurement> {
    const { measurement } = await request<{ measurement: BodyMeasurement }>(
      '/api/measurements',
      { method: 'POST', body: JSON.stringify(payload) },
    )
    return measurement
  },
  deleteMeasurement(id: string) {
    return request<{ ok: true }>(`/api/measurements/${id}`, {
      method: 'DELETE',
    })
  },
}

interface FinishSessionPayload {
  finishedAt: number
  durationSeconds: number
  totalVolumeKg: number
  notes: string
  sets: Array<{
    exerciseId: string
    setNumber: number
    weightKg: number
    reps: number
    rpe?: number | null
    completed: boolean
    completedAt?: number | null
  }>
}
