import type { FastifyInstance } from 'fastify'
import { and, eq, isNull, or } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { db, schema } from '../db/client.js'
import { WORKOUT_TEMPLATES } from '../db/seed-data.js'
import { requireAuth } from '../auth/middleware.js'

const CustomExerciseBody = z.object({
  name: z.string().min(1).max(80),
  kind: z.enum(['strength', 'cardio']).optional().default('strength'),
  primaryMuscleId: z.string().min(1),
  secondaryMuscles: z.array(z.string()).default([]),
  equipment: z.string().min(1),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  instructions: z.string().min(1).max(2000),
  imagePath: z.string().nullish(),
})

export async function catalogRoutes(app: FastifyInstance) {
  // Lista grupos musculares (público, não exige auth — necessário pra UI)
  app.get('/api/muscle-groups', async () => {
    const rows = await db.select().from(schema.muscleGroups)
    return { muscleGroups: rows }
  })

  // Lista templates pré-prontos (estático, vem do seed-data)
  app.get('/api/workout-templates', async () => {
    return { templates: WORKOUT_TEMPLATES }
  })

  // Lista exercícios visíveis pro usuário logado:
  // todos os "oficiais" (ownerId null) + os customs do próprio usuário
  app.get(
    '/api/exercises',
    { preHandler: requireAuth },
    async (req) => {
      const rows = await db
        .select()
        .from(schema.exercises)
        .where(
          or(
            isNull(schema.exercises.ownerId),
            eq(schema.exercises.ownerId, req.user!.id),
          ),
        )

      const favs = await db
        .select({ exerciseId: schema.userExerciseFavorites.exerciseId })
        .from(schema.userExerciseFavorites)
        .where(eq(schema.userExerciseFavorites.userId, req.user!.id))
      const favSet = new Set(favs.map((f) => f.exerciseId))

      return {
        exercises: rows.map((e) => ({
          ...e,
          isFavorite: favSet.has(e.id),
        })),
      }
    },
  )

  // Estatísticas de um exercício pro usuário logado: último peso usado e
  // recorde de carga. Usado na execução de treino pra mostrar "última vez" e
  // "recorde". Só lê de séries completas de sessões JÁ salvas — a sessão em
  // andamento ainda não tem séries no banco (são gravadas no finish), então
  // nunca polui o "último" com o que o usuário está digitando agora.
  app.get(
    '/api/exercises/:id/stats',
    { preHandler: requireAuth },
    async (req) => {
      const { id } = req.params as { id: string }
      const rows = await db
        .select({
          weightKg: schema.sessionSets.weightKg,
          reps: schema.sessionSets.reps,
          durationSeconds: schema.sessionSets.durationSeconds,
          distanceKm: schema.sessionSets.distanceKm,
          startedAt: schema.sessions.startedAt,
        })
        .from(schema.sessionSets)
        .innerJoin(
          schema.sessions,
          eq(schema.sessionSets.sessionId, schema.sessions.id),
        )
        .where(
          and(
            eq(schema.sessions.userId, req.user!.id),
            eq(schema.sessionSets.exerciseId, id),
            eq(schema.sessionSets.completed, true),
          ),
        )

      if (rows.length === 0) {
        return { last: null, maxWeight: null }
      }

      // "Última vez": a série mais pesada da sessão mais recente que usou esse
      // exercício (representa a carga de trabalho da última vez).
      const latestStartedAt = Math.max(...rows.map((r) => r.startedAt))
      const latestRows = rows.filter((r) => r.startedAt === latestStartedAt)
      const lastRow = latestRows.reduce((a, b) =>
        b.weightKg > a.weightKg ? b : a,
      )
      // Recorde: maior carga já registrada (desempate por mais reps).
      const maxRow = rows.reduce((a, b) => {
        if (b.weightKg > a.weightKg) return b
        if (b.weightKg === a.weightKg && b.reps > a.reps) return b
        return a
      })

      return {
        last: {
          weightKg: lastRow.weightKg,
          reps: lastRow.reps,
          durationSeconds: lastRow.durationSeconds,
          distanceKm: lastRow.distanceKm,
          startedAt: latestStartedAt,
        },
        maxWeight: {
          weightKg: maxRow.weightKg,
          reps: maxRow.reps,
          startedAt: maxRow.startedAt,
        },
      }
    },
  )

  // Cria exercício custom
  app.post(
    '/api/exercises',
    { preHandler: requireAuth },
    async (req, reply) => {
      const parsed = CustomExerciseBody.safeParse(req.body)
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ error: 'invalid_body', issues: parsed.error.issues })
      }
      const id = `ex-custom-${nanoid(10)}`
      await db.insert(schema.exercises).values({
        id,
        ownerId: req.user!.id,
        name: parsed.data.name,
        kind: parsed.data.kind,
        primaryMuscleId: parsed.data.primaryMuscleId,
        secondaryMuscles: parsed.data.secondaryMuscles,
        equipment: parsed.data.equipment,
        difficulty: parsed.data.difficulty,
        instructions: parsed.data.instructions,
        imagePath: parsed.data.imagePath ?? null,
        isCustom: true,
      })
      const [row] = await db
        .select()
        .from(schema.exercises)
        .where(eq(schema.exercises.id, id))
        .limit(1)
      return reply.code(201).send({ exercise: row })
    },
  )

  // Apaga exercício custom (só os próprios)
  app.delete(
    '/api/exercises/:id',
    { preHandler: requireAuth },
    async (req, reply) => {
      const { id } = req.params as { id: string }
      const result = await db
        .delete(schema.exercises)
        .where(
          and(
            eq(schema.exercises.id, id),
            eq(schema.exercises.ownerId, req.user!.id),
          ),
        )
      if (result.rowsAffected === 0) {
        return reply.code(404).send({ error: 'not_found_or_not_owner' })
      }
      return { ok: true }
    },
  )

  // Toggle favorito
  app.post(
    '/api/exercises/:id/favorite',
    { preHandler: requireAuth },
    async (req, reply) => {
      const { id } = req.params as { id: string }
      const [exists] = await db
        .select({ id: schema.exercises.id })
        .from(schema.exercises)
        .where(eq(schema.exercises.id, id))
        .limit(1)
      if (!exists) return reply.code(404).send({ error: 'not_found' })

      const [fav] = await db
        .select()
        .from(schema.userExerciseFavorites)
        .where(
          and(
            eq(schema.userExerciseFavorites.userId, req.user!.id),
            eq(schema.userExerciseFavorites.exerciseId, id),
          ),
        )
        .limit(1)

      if (fav) {
        await db
          .delete(schema.userExerciseFavorites)
          .where(
            and(
              eq(schema.userExerciseFavorites.userId, req.user!.id),
              eq(schema.userExerciseFavorites.exerciseId, id),
            ),
          )
        return { isFavorite: false }
      } else {
        await db.insert(schema.userExerciseFavorites).values({
          userId: req.user!.id,
          exerciseId: id,
        })
        return { isFavorite: true }
      }
    },
  )
}
