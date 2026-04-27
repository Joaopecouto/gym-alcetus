import type { FastifyInstance } from 'fastify'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '../db/client.js'
import { requireAuth } from '../auth/middleware.js'

const OnboardingBody = z.object({
  name: z.string().min(1).max(80),
  age: z.number().int().min(10).max(120),
  sex: z.enum(['male', 'female', 'other']),
  weightKg: z.number().min(20).max(400),
  heightCm: z.number().min(100).max(250),
  goal: z.enum(['hypertrophy', 'strength', 'endurance', 'general']),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  weeklyFrequency: z.number().int().min(1).max(7),
  focusMuscles: z.array(z.string()).max(20),
})

function publicUser(u: typeof schema.users.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    picture: u.picture,
    age: u.age,
    sex: u.sex,
    weightKg: u.weightKg,
    heightCm: u.heightCm,
    goal: u.goal,
    level: u.level,
    weeklyFrequency: u.weeklyFrequency,
    focusMuscles: u.focusMuscles,
    onboardingCompleted: u.onboardingCompleted,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }
}

export async function meRoutes(app: FastifyInstance) {
  // Quem está logado? (200 com user, 401 se não)
  app.get('/api/me', { preHandler: requireAuth }, async (req) => {
    return { user: publicUser(req.user!) }
  })

  // Salvar/atualizar dados de onboarding
  app.put('/api/me', { preHandler: requireAuth }, async (req, reply) => {
    const parsed = OnboardingBody.safeParse(req.body)
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: 'invalid_body', issues: parsed.error.issues })
    }

    const data = parsed.data
    await db
      .update(schema.users)
      .set({
        name: data.name,
        age: data.age,
        sex: data.sex,
        weightKg: data.weightKg,
        heightCm: data.heightCm,
        goal: data.goal,
        level: data.level,
        weeklyFrequency: data.weeklyFrequency,
        focusMuscles: data.focusMuscles,
        onboardingCompleted: true,
        updatedAt: Date.now(),
      })
      .where(eq(schema.users.id, req.user!.id))

    const [updated] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.user!.id))
      .limit(1)

    return { user: publicUser(updated!) }
  })
}
