import { SignJWT, jwtVerify } from 'jose'
import { config } from '../config.js'

const ISSUER = 'gym-alcetus'
const AUDIENCE = 'gym-alcetus-app'
const SESSION_TTL_DAYS = 30

function getSecretKey() {
  return new TextEncoder().encode(config.jwtSecret)
}

export interface SessionPayload {
  userId: string
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_DAYS}d`)
    .sign(getSecretKey())
}

export async function verifySession(token: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, getSecretKey(), {
    issuer: ISSUER,
    audience: AUDIENCE,
  })

  if (typeof payload.userId !== 'string') {
    throw new Error('Session token missing userId')
  }

  return { userId: payload.userId }
}

export const SESSION_COOKIE = 'gym-alcetus-session'
export const SESSION_TTL_SECONDS = SESSION_TTL_DAYS * 24 * 60 * 60
