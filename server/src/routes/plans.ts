import type { FastifyInstance } from 'fastify'
import { and, eq, ne } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { db, schema } from '../db/client.js'
import { requireAuth } from '../auth/middleware.js'

const PlanDayInput = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  workoutId: z.string().nullable(),
})

const PlanBody = z.object({
  name: z.string().min(1).max(80),
  isActive: z.boolean().optional(),
  days: z.array(PlanDayInput).max(7),
})

async function loadPlanFull(planId: string) {
  const [plan] = await db
    .select()
    .from(schema.plans)
    .where(eq(schema.plans.id, planId))
    .limit(1)
  if (!plan) return null
  const days = await db
    .select()
    .from(schema.planDays)
    .where(eq(schema.planDays.planId, planId))
  return { ...plan, days }
}

export async function planRoutes(app: FastifyInstance) {
  app.get('/api/plans', { preHandler: requireAuth }, async (req) => {
    const plans = await db
      .select()
      .from(schema.plans)
      .where(eq(schema.plans.userId, req.user!.id))
    const days = await db
      .select()
      .from(schema.planDays)
      .where(
        // join: plans.userId === user.id implícito porque já filtramos planos.
        // Aqui pegamos todos os planDays cujo plan_id está nos planos do user.
        // Pra simplificar, fazemos N+1 (poucos planos por usuário, ok)
        eq(schema.planDays.planId, plans[0]?.id ?? '__none__'),
      )
    // Reagrupa por planId quando há mais de um plano
    const allDays =
      plans.length > 1
        ? await db.select().from(schema.planDays)
        : days
    const dayByPlan = new Map<string, typeof allDays>()
    for (const d of allDays) {
      const arr = dayByPlan.get(d.planId) ?? []
      arr.push(d)
      dayByPlan.set(d.planId, arr)
    }
    return {
      plans: plans.map((p) => ({ ...p, days: dayByPlan.get(p.id) ?? [] })),
    }
  })

  app.get(
    '/api/plans/:id',
    { preHandler: requireAuth },
    async (req, reply) => {
      const { id } = req.params as { id: string }
      const full = await loadPlanFull(id)
      if (!full || full.userId !== req.user!.id) {
        return reply.code(404).send({ error: 'not_found' })
      }
      return { plan: full }
    },
  )

  app.post('/api/plans', { preHandler: requireAuth }, async (req, reply) => {
    const parsed = PlanBody.safeParse(req.body)
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: 'invalid_body', issues: parsed.error.issues })
    }

    const planId = nanoid()
    await db.transaction(async (tx) => {
      // Se vai ativar, desativa os outros do mesmo user
      if (parsed.data.isActive) {
        await tx
          .update(schema.plans)
          .set({ isActive: false })
          .where(eq(schema.plans.userId, req.user!.id))
      }
      await tx.insert(schema.plans).values({
        id: planId,
        userId: req.user!.id,
        name: parsed.data.name,
        isActive: parsed.data.isActive ?? false,
      })
      if (parsed.data.days.length > 0) {
        await tx.insert(schema.planDays).values(
          parsed.data.days.map((d) => ({
            id: nanoid(),
            planId,
            dayOfWeek: d.dayOfWeek,
            workoutId: d.workoutId,
          })),
        )
      }
    })

    const full = await loadPlanFull(planId)
    return reply.code(201).send({ plan: full })
  })

  app.put('/api/plans/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const parsed = PlanBody.safeParse(req.body)
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: 'invalid_body', issues: parsed.error.issues })
    }

    const [existing] = await db
      .select()
      .from(schema.plans)
      .where(eq(schema.plans.id, id))
      .limit(1)
    if (!existing || existing.userId !== req.user!.id) {
      return reply.code(404).send({ error: 'not_found' })
    }

    await db.transaction(async (tx) => {
      if (parsed.data.isActive) {
        await tx
          .update(schema.plans)
          .set({ isActive: false })
          .where(
            and(
              eq(schema.plans.userId, req.user!.id),
              ne(schema.plans.id, id),
            ),
          )
      }
      await tx
        .update(schema.plans)
        .set({
          name: parsed.data.name,
          isActive: parsed.data.isActive ?? existing.isActive,
        })
        .where(eq(schema.plans.id, id))

      await tx.delete(schema.planDays).where(eq(schema.planDays.planId, id))
      if (parsed.data.days.length > 0) {
        await tx.insert(schema.planDays).values(
          parsed.data.days.map((d) => ({
            id: nanoid(),
            planId: id,
            dayOfWeek: d.dayOfWeek,
            workoutId: d.workoutId,
          })),
        )
      }
    })

    const full = await loadPlanFull(id)
    return { plan: full }
  })

  app.post(
    '/api/plans/:id/activate',
    { preHandler: requireAuth },
    async (req, reply) => {
      const { id } = req.params as { id: string }
      const [existing] = await db
        .select()
        .from(schema.plans)
        .where(eq(schema.plans.id, id))
        .limit(1)
      if (!existing || existing.userId !== req.user!.id) {
        return reply.code(404).send({ error: 'not_found' })
      }
      await db.transaction(async (tx) => {
        await tx
          .update(schema.plans)
          .set({ isActive: false })
          .where(eq(schema.plans.userId, req.user!.id))
        await tx
          .update(schema.plans)
          .set({ isActive: true })
          .where(eq(schema.plans.id, id))
      })
      return { ok: true }
    },
  )

  app.delete(
    '/api/plans/:id',
    { preHandler: requireAuth },
    async (req, reply) => {
      const { id } = req.params as { id: string }
      const result = await db
        .delete(schema.plans)
        .where(
          and(
            eq(schema.plans.id, id),
            eq(schema.plans.userId, req.user!.id),
          ),
        )
      if (result.rowsAffected === 0) {
        return reply.code(404).send({ error: 'not_found' })
      }
      return { ok: true }
    },
  )
}
