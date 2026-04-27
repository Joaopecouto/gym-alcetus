import type { FastifyInstance } from 'fastify'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { db, schema } from '../db/client.js'
import { requireAuth } from '../auth/middleware.js'

const WorkoutExerciseInput = z.object({
  exerciseId: z.string().min(1),
  setsTarget: z.number().int().min(1).max(20),
  repsMin: z.number().int().min(1).max(50),
  repsMax: z.number().int().min(1).max(50),
  restSeconds: z.number().int().min(0).max(600),
  weightTargetKg: z.number().nullable().optional(),
  notes: z.string().max(300).default(''),
})

const WorkoutBody = z.object({
  name: z.string().min(1).max(80),
  mode: z.enum(['hypertrophy', 'strength']),
  color: z.string().max(20).nullable().optional(),
  notes: z.string().max(500).default(''),
  exercises: z.array(WorkoutExerciseInput).min(1).max(40),
})

async function loadWorkoutFull(workoutId: string) {
  const [workout] = await db
    .select()
    .from(schema.workouts)
    .where(eq(schema.workouts.id, workoutId))
    .limit(1)
  if (!workout) return null

  const exercises = await db
    .select()
    .from(schema.workoutExercises)
    .where(eq(schema.workoutExercises.workoutId, workoutId))
    .orderBy(asc(schema.workoutExercises.orderIndex))

  return { ...workout, exercises }
}

export async function workoutRoutes(app: FastifyInstance) {
  app.get(
    '/api/workouts',
    { preHandler: requireAuth },
    async (req) => {
      const rows = await db
        .select()
        .from(schema.workouts)
        .where(eq(schema.workouts.userId, req.user!.id))
      if (rows.length === 0) return { workouts: [] }

      const allExercises = await db
        .select()
        .from(schema.workoutExercises)
        .where(
          inArray(
            schema.workoutExercises.workoutId,
            rows.map((r) => r.id),
          ),
        )
        .orderBy(asc(schema.workoutExercises.orderIndex))

      const byWorkout = new Map<
        string,
        (typeof schema.workoutExercises.$inferSelect)[]
      >()
      for (const e of allExercises) {
        const arr = byWorkout.get(e.workoutId) ?? []
        arr.push(e)
        byWorkout.set(e.workoutId, arr)
      }

      return {
        workouts: rows.map((r) => ({
          ...r,
          exercises: byWorkout.get(r.id) ?? [],
        })),
      }
    },
  )

  app.get(
    '/api/workouts/:id',
    { preHandler: requireAuth },
    async (req, reply) => {
      const { id } = req.params as { id: string }
      const full = await loadWorkoutFull(id)
      if (!full || full.userId !== req.user!.id) {
        return reply.code(404).send({ error: 'not_found' })
      }
      return { workout: full }
    },
  )

  app.post(
    '/api/workouts',
    { preHandler: requireAuth },
    async (req, reply) => {
      const parsed = WorkoutBody.safeParse(req.body)
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ error: 'invalid_body', issues: parsed.error.issues })
      }

      const workoutId = nanoid()
      await db.transaction(async (tx) => {
        await tx.insert(schema.workouts).values({
          id: workoutId,
          userId: req.user!.id,
          name: parsed.data.name,
          mode: parsed.data.mode,
          color: parsed.data.color ?? null,
          notes: parsed.data.notes,
        })
        const exRows = parsed.data.exercises.map((e, i) => ({
          id: nanoid(),
          workoutId,
          exerciseId: e.exerciseId,
          orderIndex: i,
          setsTarget: e.setsTarget,
          repsMin: e.repsMin,
          repsMax: e.repsMax,
          restSeconds: e.restSeconds,
          weightTargetKg: e.weightTargetKg ?? null,
          notes: e.notes,
        }))
        await tx.insert(schema.workoutExercises).values(exRows)
      })

      const full = await loadWorkoutFull(workoutId)
      return reply.code(201).send({ workout: full })
    },
  )

  app.put(
    '/api/workouts/:id',
    { preHandler: requireAuth },
    async (req, reply) => {
      const { id } = req.params as { id: string }
      const parsed = WorkoutBody.safeParse(req.body)
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ error: 'invalid_body', issues: parsed.error.issues })
      }

      const [existing] = await db
        .select()
        .from(schema.workouts)
        .where(eq(schema.workouts.id, id))
        .limit(1)
      if (!existing || existing.userId !== req.user!.id) {
        return reply.code(404).send({ error: 'not_found' })
      }

      await db.transaction(async (tx) => {
        await tx
          .update(schema.workouts)
          .set({
            name: parsed.data.name,
            mode: parsed.data.mode,
            color: parsed.data.color ?? null,
            notes: parsed.data.notes,
            updatedAt: Date.now(),
          })
          .where(eq(schema.workouts.id, id))

        await tx
          .delete(schema.workoutExercises)
          .where(eq(schema.workoutExercises.workoutId, id))

        const exRows = parsed.data.exercises.map((e, i) => ({
          id: nanoid(),
          workoutId: id,
          exerciseId: e.exerciseId,
          orderIndex: i,
          setsTarget: e.setsTarget,
          repsMin: e.repsMin,
          repsMax: e.repsMax,
          restSeconds: e.restSeconds,
          weightTargetKg: e.weightTargetKg ?? null,
          notes: e.notes,
        }))
        await tx.insert(schema.workoutExercises).values(exRows)
      })

      const full = await loadWorkoutFull(id)
      return { workout: full }
    },
  )

  app.delete(
    '/api/workouts/:id',
    { preHandler: requireAuth },
    async (req, reply) => {
      const { id } = req.params as { id: string }
      const result = await db
        .delete(schema.workouts)
        .where(
          and(
            eq(schema.workouts.id, id),
            eq(schema.workouts.userId, req.user!.id),
          ),
        )
      if (result.rowsAffected === 0) {
        return reply.code(404).send({ error: 'not_found' })
      }
      return { ok: true }
    },
  )
}
