import { sql } from 'drizzle-orm'
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

const timestamps = {
  createdAt: integer('created_at', { mode: 'number' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'number' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
}

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  // Google identity
  googleId: text('google_id').notNull().unique(),
  email: text('email').notNull(),
  picture: text('picture'),
  // Profile (filled during onboarding — nullable until then)
  name: text('name').notNull(),
  age: integer('age'),
  sex: text('sex', { enum: ['male', 'female', 'other'] }),
  weightKg: real('weight_kg'),
  heightCm: real('height_cm'),
  goal: text('goal', {
    enum: ['hypertrophy', 'strength', 'endurance', 'general'],
  }),
  level: text('level', {
    enum: ['beginner', 'intermediate', 'advanced'],
  }),
  weeklyFrequency: integer('weekly_frequency'),
  focusMuscles: text('focus_muscles', { mode: 'json' }).$type<string[]>(),
  onboardingCompleted: integer('onboarding_completed', { mode: 'boolean' })
    .notNull()
    .default(false),
  ...timestamps,
})

export const muscleGroups = sqliteTable('muscle_groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  namePt: text('name_pt').notNull(),
})

export const exercises = sqliteTable('exercises', {
  id: text('id').primaryKey(),
  // Owner: null for system/seeded exercises, userId for custom ones
  ownerId: text('owner_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  // Tipo: 'strength' = peso × reps; 'cardio' = duração + distância
  kind: text('kind', { enum: ['strength', 'cardio'] })
    .notNull()
    .default('strength'),
  primaryMuscleId: text('primary_muscle_id')
    .notNull()
    .references(() => muscleGroups.id),
  secondaryMuscles: text('secondary_muscles', { mode: 'json' })
    .notNull()
    .$type<string[]>(),
  equipment: text('equipment').notNull(),
  difficulty: text('difficulty', {
    enum: ['beginner', 'intermediate', 'advanced'],
  }).notNull(),
  instructions: text('instructions').notNull(),
  imagePath: text('image_path'),
  isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'number' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
})

export const userExerciseFavorites = sqliteTable('user_exercise_favorites', {
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  exerciseId: text('exercise_id')
    .notNull()
    .references(() => exercises.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'number' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
})

export const workouts = sqliteTable('workouts', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  mode: text('mode', { enum: ['hypertrophy', 'strength'] }).notNull(),
  color: text('color'),
  notes: text('notes').notNull().default(''),
  ...timestamps,
})

export const workoutExercises = sqliteTable('workout_exercises', {
  id: text('id').primaryKey(),
  workoutId: text('workout_id')
    .notNull()
    .references(() => workouts.id, { onDelete: 'cascade' }),
  exerciseId: text('exercise_id')
    .notNull()
    .references(() => exercises.id),
  orderIndex: integer('order_index').notNull(),
  setsTarget: integer('sets_target').notNull(),
  repsMin: integer('reps_min').notNull(),
  repsMax: integer('reps_max').notNull(),
  restSeconds: integer('rest_seconds').notNull(),
  weightTargetKg: real('weight_target_kg'),
  // Pra exercícios de cardio: alvo de duração e distância por "série" (intervalo).
  durationSecondsTarget: integer('duration_seconds_target'),
  distanceKmTarget: real('distance_km_target'),
  notes: text('notes').notNull().default(''),
})

export const plans = sqliteTable('plans', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'number' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
})

export const planDays = sqliteTable('plan_days', {
  id: text('id').primaryKey(),
  planId: text('plan_id')
    .notNull()
    .references(() => plans.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(),
  workoutId: text('workout_id').references(() => workouts.id),
})

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  workoutId: text('workout_id')
    .notNull()
    .references(() => workouts.id),
  planId: text('plan_id').references(() => plans.id),
  startedAt: integer('started_at').notNull(),
  finishedAt: integer('finished_at'),
  durationSeconds: integer('duration_seconds'),
  totalVolumeKg: real('total_volume_kg'),
  notes: text('notes').notNull().default(''),
})

export const sessionSets = sqliteTable('session_sets', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  exerciseId: text('exercise_id')
    .notNull()
    .references(() => exercises.id),
  setNumber: integer('set_number').notNull(),
  weightKg: real('weight_kg').notNull(),
  reps: integer('reps').notNull(),
  // Pra cardio: duração efetiva e distância percorrida no intervalo
  durationSeconds: integer('duration_seconds'),
  distanceKm: real('distance_km'),
  rpe: real('rpe'),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  isPr: integer('is_pr', { mode: 'boolean' }).notNull().default(false),
  completedAt: integer('completed_at'),
})

export const bodyMeasurements = sqliteTable('body_measurements', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  date: integer('date').notNull(),
  weightKg: real('weight_kg'),
  bodyFatPct: real('body_fat_pct'),
  chest: real('chest'),
  waist: real('waist'),
  armL: real('arm_l'),
  armR: real('arm_r'),
  thighL: real('thigh_l'),
  thighR: real('thigh_r'),
  calfL: real('calf_l'),
  calfR: real('calf_r'),
  notes: text('notes').notNull().default(''),
})

export const personalRecords = sqliteTable('personal_records', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  exerciseId: text('exercise_id')
    .notNull()
    .references(() => exercises.id),
  weightKg: real('weight_kg').notNull(),
  reps: integer('reps').notNull(),
  estimated1rm: real('estimated_1rm').notNull(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  date: integer('date').notNull(),
})
