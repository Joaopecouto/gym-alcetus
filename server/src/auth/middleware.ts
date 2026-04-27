import type { FastifyReply, FastifyRequest } from 'fastify'
import { eq } from 'drizzle-orm'
import { db, schema } from '../db/client.js'
import { SESSION_COOKIE, verifySession } from './session.js'

declare module 'fastify' {
  interface FastifyRequest {
    user?: typeof schema.users.$inferSelect
  }
}

/** Loads `request.user` from session cookie if present. Does not block. */
export async function loadUser(req: FastifyRequest) {
  const token = req.cookies[SESSION_COOKIE]
  if (!token) return

  try {
    const { userId } = await verifySession(token)
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1)
    if (user) {
      req.user = user
    }
  } catch {
    // invalid/expired token — ignore, treat as logged out
  }
}

/** Blocks the request unless a valid user is loaded. */
export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  if (!req.user) {
    return reply.code(401).send({ error: 'unauthenticated' })
  }
}
