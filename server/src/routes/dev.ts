import type { FastifyInstance } from 'fastify'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { db, schema } from '../db/client.js'
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  signSession,
} from '../auth/session.js'
import { config } from '../config.js'

/**
 * Rotas pra dev/preview SOMENTE. Nunca registradas em produção.
 * Permitem entrar sem Google login pra visualizar o app.
 */
export async function devRoutes(app: FastifyInstance) {
  app.post('/api/dev/bypass', async (_req, reply) => {
    const FAKE_GOOGLE_ID = 'dev-bypass-user'
    const [existing] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.googleId, FAKE_GOOGLE_ID))
      .limit(1)

    let userId: string
    if (existing) {
      userId = existing.id
    } else {
      userId = nanoid()
      await db.insert(schema.users).values({
        id: userId,
        googleId: FAKE_GOOGLE_ID,
        email: 'demo@iron-track.dev',
        name: 'João (preview)',
        picture: null,
      })
    }

    const token = await signSession({ userId })
    reply.setCookie(SESSION_COOKIE, token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      domain: config.cookieDomain,
      maxAge: SESSION_TTL_SECONDS,
    })
    return { ok: true, userId }
  })
}
