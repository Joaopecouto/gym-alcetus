import Dexie, { type EntityTable } from 'dexie'
import type {
  BodyMeasurement,
  Exercise,
  MuscleGroup,
  PersonalRecord,
  Plan,
  PlanDay,
  Session,
  SessionSet,
  User,
  Workout,
  WorkoutExercise,
} from './schema'

export class IronTrackDB extends Dexie {
  user!: EntityTable<User, 'id'>
  muscleGroups!: EntityTable<MuscleGroup, 'id'>
  exercises!: EntityTable<Exercise, 'id'>
  workouts!: EntityTable<Workout, 'id'>
  workoutExercises!: EntityTable<WorkoutExercise, 'id'>
  plans!: EntityTable<Plan, 'id'>
  planDays!: EntityTable<PlanDay, 'id'>
  sessions!: EntityTable<Session, 'id'>
  sessionSets!: EntityTable<SessionSet, 'id'>
  bodyMeasurements!: EntityTable<BodyMeasurement, 'id'>
  personalRecords!: EntityTable<PersonalRecord, 'id'>

  constructor() {
    super('iron-track')

    this.version(1).stores({
      user: '&id, updatedAt',
      muscleGroups: '&id, name',
      exercises: '&id, name, primaryMuscleId, isCustom, isFavorite',
      workouts: '&id, name, mode, createdAt',
      workoutExercises: '&id, workoutId, exerciseId, [workoutId+orderIndex]',
      plans: '&id, isActive, createdAt',
      planDays: '&id, planId, dayOfWeek, [planId+dayOfWeek]',
      sessions: '&id, workoutId, startedAt, finishedAt',
      sessionSets:
        '&id, sessionId, exerciseId, [sessionId+exerciseId+setNumber]',
      bodyMeasurements: '&id, date',
      personalRecords: '&id, exerciseId, date, [exerciseId+date]',
    })
  }
}

export const db = new IronTrackDB()

export async function hasUser(): Promise<boolean> {
  const count = await db.user.count()
  return count > 0
}
