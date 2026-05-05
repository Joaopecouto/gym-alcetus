import type { FastifyReply, FastifyRequest } from 'fastify'
import { eq } from 'drizzle-orm'
import { db, schema } from '../db/client.js'
import { config } from '../config.js'
import { SESSION_COOKIE, verifySession } from './session.js'

declare module 'fastify' {
  interface FastifyRequest {
    user?: typeof schema.users.$inferSelect
  }
}

/** Loads `request.user` from session cookie if present. Does not block.
 *  Se o cookie estiver inválido (assinatura errada por causa de JWT_SECRET
 *  novo, ou usuário sumiu do banco), apaga o cookie pra que requisições
 *  futuras desse cliente não fiquem mandando lixo. Faz isso em DOIS escopos
 *  porque migrations entre VPSes podem ter setado cookies com domain
 *  host-only (gym.alcetus.com) e domain broad (.alcetus.com) que coexistem
 *  no browser e atrapalham. */
export async function loadUser(req: FastifyRequest, reply: FastifyReply) {
  const token = req.cookies[SESSION_COOKIE]
  if (!token) return

  let userId: string | null = null
  try {
    const payload = await verifySession(token)
    userId = payload.userId
  } catch {
    clearStaleSession(reply)
    return
  }

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1)
  if (user) {
    req.user = user
  } else {
    // Token assinado bate, mas user não existe — banco foi recriado.
    clearStaleSession(reply)
  }
}

function clearStaleSession(reply: FastifyReply) {
  reply.clearCookie(SESSION_COOKIE, { path: '/' })
  if (config.cookieDomain) {
    reply.clearCookie(SESSION_COOKIE, {
      path: '/',
      domain: config.cookieDomain,
    })
  }
}

/** Blocks the request unless a valid user is loaded. */
export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  if (!req.user) {
    return reply.code(401).send({ error: 'unauthenticated' })
  }
}
