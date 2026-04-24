export type Sex = 'male' | 'female' | 'other'
export type Goal = 'hypertrophy' | 'strength' | 'endurance' | 'general'
export type Level = 'beginner' | 'intermediate' | 'advanced'
export type WorkoutMode = 'hypertrophy' | 'strength'

export interface User {
  id: string
  name: string
  age: number
  sex: Sex
  weightKg: number
  heightCm: number
  goal: Goal
  level: Level
  weeklyFrequency: number
  focusMuscles: string[]
  createdAt: number
  updatedAt: number
}

export interface MuscleGroup {
  id: string
  name: string
  namePt: string
}

export interface Exercise {
  id: string
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
  name: string
  mode: WorkoutMode
  color: string | null
  notes: string
  createdAt: number
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

export interface Plan {
  id: string
  name: string
  isActive: boolean
  createdAt: number
}

export interface PlanDay {
  id: string
  planId: string
  dayOfWeek: number // 0 = Sunday, 6 = Saturday
  workoutId: string | null // null = rest day
}

export interface Session {
  id: string
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

export interface BodyMeasurement {
  id: string
  date: number
  weightKg: number | null
  bodyFatPct: number | null
  chest: number | null
  waist: number | null
  armL: number | null
  armR: number | null
  thighL: number | null
  thighR: number | null
  calfL: number | null
  calfR: number | null
  notes: string
}

export interface PersonalRecord {
  id: string
  exerciseId: string
  weightKg: number
  reps: number
  estimated1rm: number
  sessionId: string
  date: number
}
