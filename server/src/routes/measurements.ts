import type { FastifyInstance } from 'fastify'
import { and, desc, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { db, schema } from '../db/client.js'
import { requireAuth } from '../auth/middleware.js'

const MeasurementBody = z.object({
  date: z.number().optional(), // default = agora
  weightKg: z.number().min(20).max(400).nullish(),
  bodyFatPct: z.number().min(0).max(80).nullish(),
  chest: z.number().min(0).max(300).nullish(),
  waist: z.number().min(0).max(300).nullish(),
  armL: z.number().min(0).max(100).nullish(),
  armR: z.number().min(0).max(100).nullish(),
  thighL: z.number().min(0).max(150).nullish(),
  thighR: z.number().min(0).max(150).nullish(),
  calfL: z.number().min(0).max(100).nullish(),
  calfR: z.number().min(0).max(100).nullish(),
  notes: z.string().max(500).optional().default(''),
})

export async function measurementRoutes(app: FastifyInstance) {
  app.get(
    '/api/measurements',
    { preHandler: requireAuth },
    async (req) => {
      const rows = await db
        .select()
        .from(schema.bodyMeasurements)
        .where(eq(schema.bodyMeasurements.userId, req.user!.id))
        .orderBy(desc(schema.bodyMeasurements.date))
      return { measurements: rows }
    },
  )

  app.post(
    '/api/measurements',
    { preHandler: requireAuth },
    async (req, reply) => {
      const parsed = MeasurementBody.safeParse(req.body)
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ error: 'invalid_body', issues: parsed.error.issues })
      }
      const id = nanoid()
      const now = parsed.data.date ?? Date.now()

      await db.transaction(async (tx) => {
        await tx.insert(schema.bodyMeasurements).values({
          id,
          userId: req.user!.id,
          date: now,
          weightKg: parsed.data.weightKg ?? null,
          bodyFatPct: parsed.data.bodyFatPct ?? null,
          chest: parsed.data.chest ?? null,
          waist: parsed.data.waist ?? null,
          armL: parsed.data.armL ?? null,
          armR: parsed.data.armR ?? null,
          thighL: parsed.data.thighL ?? null,
          thighR: parsed.data.thighR ?? null,
          calfL: parsed.data.calfL ?? null,
          calfR: parsed.data.calfR ?? null,
          notes: parsed.data.notes ?? '',
        })

        // Sincroniza users.weightKg com a última medição (se peso foi setado)
        if (parsed.data.weightKg) {
          await tx
            .update(schema.users)
            .set({
              weightKg: parsed.data.weightKg,
              updatedAt: Date.now(),
            })
            .where(eq(schema.users.id, req.user!.id))
        }
      })

      const [row] = await db
        .select()
        .from(schema.bodyMeasurements)
        .where(eq(schema.bodyMeasurements.id, id))
        .limit(1)
      return reply.code(201).send({ measurement: row })
    },
  )

  app.delete(
    '/api/measurements/:id',
    { preHandler: requireAuth },
    async (req, reply) => {
      const { id } = req.params as { id: string }
      const result = await db
        .delete(schema.bodyMeasurements)
        .where(
          and(
            eq(schema.bodyMeasurements.id, id),
            eq(schema.bodyMeasurements.userId, req.user!.id),
          ),
        )
      if (result.rowsAffected === 0) {
        return reply.code(404).send({ error: 'not_found' })
      }
      return { ok: true }
    },
  )
}
