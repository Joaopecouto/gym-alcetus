import type { FastifyInstance } from 'fastify'
import { and, asc, desc, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { db, schema } from '../db/client.js'
import { requireAuth } from '../auth/middleware.js'

const StartSessionBody = z.object({
  workoutId: z.string().min(1),
  planId: z.string().nullish(),
})

const SessionSetInput = z.object({
  exerciseId: z.string().min(1),
  setNumber: z.number().int().min(1),
  weightKg: z.number().min(0),
  reps: z.number().int().min(0),
  rpe: z.number().min(0).max(10).nullable().optional(),
  completed: z.boolean(),
  completedAt: z.number().nullable().optional(),
})

const FinishSessionBody = z.object({
  finishedAt: z.number(),
  durationSeconds: z.number().int().min(0),
  totalVolumeKg: z.number().min(0),
  notes: z.string().max(2000).default(''),
  sets: z.array(SessionSetInput),
})

export async function sessionRoutes(app: FastifyInstance) {
  // Lista do histórico
  app.get(
    '/api/sessions',
    { preHandler: requireAuth },
    async (req) => {
      const rows = await db
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions.userId, req.user!.id))
        .orderBy(desc(schema.sessions.startedAt))
      return { sessions: rows }
    },
  )

  // Detalhe de uma sessão (com séries)
  app.get(
    '/api/sessions/:id',
    { preHandler: requireAuth },
    async (req, reply) => {
      const { id } = req.params as { id: string }
      const [s] = await db
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions.id, id))
        .limit(1)
      if (!s || s.userId !== req.user!.id) {
        return reply.code(404).send({ error: 'not_found' })
      }
      const sets = await db
        .select()
        .from(schema.sessionSets)
        .where(eq(schema.sessionSets.sessionId, id))
        .orderBy(asc(schema.sessionSets.setNumber))
      return { session: { ...s, sets } }
    },
  )

  // Inicia sessão (registra started_at, retorna o id)
  app.post(
    '/api/sessions',
    { preHandler: requireAuth },
    async (req, reply) => {
      const parsed = StartSessionBody.safeParse(req.body)
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ error: 'invalid_body', issues: parsed.error.issues })
      }
      const id = nanoid()
      await db.insert(schema.sessions).values({
        id,
        userId: req.user!.id,
        workoutId: parsed.data.workoutId,
        planId: parsed.data.planId ?? null,
        startedAt: Date.now(),
      })
      return reply.code(201).send({ id })
    },
  )

  // Finaliza sessão (grava finishedAt, sets, métricas)
  app.put(
    '/api/sessions/:id/finish',
    { preHandler: requireAuth },
    async (req, reply) => {
      const { id } = req.params as { id: string }
      const parsed = FinishSessionBody.safeParse(req.body)
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ error: 'invalid_body', issues: parsed.error.issues })
      }

      const [s] = await db
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions.id, id))
        .limit(1)
      if (!s || s.userId !== req.user!.id) {
        return reply.code(404).send({ error: 'not_found' })
      }

      await db.transaction(async (tx) => {
        await tx
          .update(schema.sessions)
          .set({
            finishedAt: parsed.data.finishedAt,
            durationSeconds: parsed.data.durationSeconds,
            totalVolumeKg: parsed.data.totalVolumeKg,
            notes: parsed.data.notes,
          })
          .where(eq(schema.sessions.id, id))

        await tx
          .delete(schema.sessionSets)
          .where(eq(schema.sessionSets.sessionId, id))

        if (parsed.data.sets.length > 0) {
          await tx.insert(schema.sessionSets).values(
            parsed.data.sets.map((s) => ({
              id: nanoid(),
              sessionId: id,
              exerciseId: s.exerciseId,
              setNumber: s.setNumber,
              weightKg: s.weightKg,
              reps: s.reps,
              rpe: s.rpe ?? null,
              completed: s.completed,
              completedAt: s.completedAt ?? null,
              isPr: false,
            })),
          )
        }
      })

      return { ok: true }
    },
  )

  app.delete(
    '/api/sessions/:id',
    { preHandler: requireAuth },
    async (req, reply) => {
      const { id } = req.params as { id: string }
      const result = await db
        .delete(schema.sessions)
        .where(
          and(
            eq(schema.sessions.id, id),
            eq(schema.sessions.userId, req.user!.id),
          ),
        )
      if (result.rowsAffected === 0) {
        return reply.code(404).send({ error: 'not_found' })
      }
      return { ok: true }
    },
  )
}
