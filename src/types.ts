export type Sex = 'male' | 'female' | 'other'
export type Goal = 'hypertrophy' | 'strength' | 'endurance' | 'general'
export type Level = 'beginner' | 'intermediate' | 'advanced'
export type WorkoutMode = 'hypertrophy' | 'strength'

export interface User {
  id: string
  email: string
  name: string
  picture: string | null
  age: number | null
  sex: Sex | null
  weightKg: number | null
  heightCm: number | null
  goal: Goal | null
  level: Level | null
  weeklyFrequency: number | null
  focusMuscles: string[] | null
  onboardingCompleted: boolean
  createdAt: number
  updatedAt: number
}

export interface OnboardingPayload {
  name: string
  age: number
  sex: Sex
  weightKg: number
  heightCm: number
  goal: Goal
  level: Level
  weeklyFrequency: number
  focusMuscles: string[]
}

export interface MuscleGroup {
  id: string
  name: string
  namePt: string
}

export interface Exercise {
  id: string
  ownerId: string | null
  name: string
  primaryMuscleId: string
  secondaryMuscles: string[]
  equipment: string
  difficulty: Level
  instructions: string
  imagePath: string | null
  isCustom: boolean
  isFavorite: boolean
  createdAt: number
}

export interface Workout {
  id: string
  userId: string
  name: string
  mode: WorkoutMode
  color: string | null
  notes: string
  createdAt: number
  updatedAt: number
}

export interface WorkoutExercise {
  id: string
  workoutId: string
  exerciseId: string
  orderIndex: number
  setsTarget: number
  repsMin: number
  repsMax: number
  restSeconds: number
  weightTargetKg: number | null
  notes: string
}

export interface WorkoutWithExercises extends Workout {
  exercises: WorkoutExercise[]
}

export interface WorkoutInput {
  name: string
  mode: WorkoutMode
  color?: string | null
  notes?: string
  exercises: Array<{
    exerciseId: string
    setsTarget: number
    repsMin: number
    repsMax: number
    restSeconds: number
    weightTargetKg?: number | null
    notes?: string
  }>
}

export interface WorkoutTemplate {
  id: string
  name: string
  mode: WorkoutMode
  description: string
  exercises: Array<{
    exerciseId: string
    setsTarget: number
    repsMin: number
    repsMax: number
    restSeconds: number
  }>
}

export interface Plan {
  id: string
  userId: string
  name: string
  isActive: boolean
  createdAt: number
  days: PlanDay[]
}

export interface PlanDay {
  id: string
  planId: string
  dayOfWeek: number // 0 = domingo, 6 = sábado
  workoutId: string | null
}

export interface PlanInput {
  name: string
  isActive?: boolean
  days: Array<{
    dayOfWeek: number
    workoutId: string | null
  }>
}

export const DAY_LABELS_FULL = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
] as const

export const DAY_LABELS_SHORT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'] as const

export interface Session {
  id: string
  userId: string
  workoutId: string
  planId: string | null
  startedAt: number
  finishedAt: number | null
  durationSeconds: number | null
  totalVolumeKg: number | null
  notes: string
}

export interface SessionSet {
  id: string
  sessionId: string
  exerciseId: string
  setNumber: number
  weightKg: number
  reps: number
  rpe: number | null
  completed: boolean
  isPr: boolean
  completedAt: number | null
}

export interface SessionWithSets extends Session {
  sets: SessionSet[]
}

export const MUSCLE_COLORS: Record<string, string> = {
  chest: '#dc2626',
  back: '#2563eb',
  quads: '#7c3aed',
  hamstrings: '#9333ea',
  glutes: '#c026d3',
  calves: '#db2777',
  shoulders: '#ea580c',
  biceps: '#16a34a',
  triceps: '#0d9488',
  abs: '#ca8a04',
  traps: '#0891b2',
  forearms: '#65a30d',
}

export const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Barra',
  dumbbell: 'Halteres',
  machine: 'Máquina',
  cable: 'Polia/Cabo',
  bodyweight: 'Peso corporal',
  kettlebell: 'Kettlebell',
  bands: 'Elásticos',
}
