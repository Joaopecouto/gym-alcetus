import type { FastifyInstance } from 'fastify'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { db, schema } from '../db/client.js'
import { verifyGoogleIdToken } from '../auth/google.js'
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  signSession,
} from '../auth/session.js'
import { config, isProd } from '../config.js'

const GoogleLoginBody = z.object({
  credential: z.string().min(20),
})

export async function authRoutes(app: FastifyInstance) {
  app.post('/api/auth/google', async (req, reply) => {
    const parsed = GoogleLoginBody.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_body' })
    }

    let profile
    try {
      profile = await verifyGoogleIdToken(parsed.data.credential)
    } catch (err) {
      app.log.warn({ err }, 'Google ID token verification failed')
      return reply.code(401).send({ error: 'invalid_credential' })
    }

    if (!profile.emailVerified) {
      return reply.code(403).send({ error: 'email_not_verified' })
    }

    // upsert user
    const [existing] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.googleId, profile.googleId))
      .limit(1)

    let userId: string
    if (existing) {
      userId = existing.id
      await db
        .update(schema.users)
        .set({
          email: profile.email,
          picture: profile.picture ?? null,
          name: existing.name || profile.name,
          updatedAt: Date.now(),
        })
        .where(eq(schema.users.id, userId))
    } else {
      userId = nanoid()
      await db.insert(schema.users).values({
        id: userId,
        googleId: profile.googleId,
        email: profile.email,
        picture: profile.picture ?? null,
        name: profile.name,
      })
    }

    const token = await signSession({ userId })

    reply.setCookie(SESSION_COOKIE, token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: config.cookieSecure && isProd(),
      domain: config.cookieDomain,
      maxAge: SESSION_TTL_SECONDS,
    })

    return { ok: true }
  })

  app.post('/api/auth/logout', async (_req, reply) => {
    reply.clearCookie(SESSION_COOKIE, {
      path: '/',
      domain: config.cookieDomain,
    })
    return { ok: true }
  })
}
