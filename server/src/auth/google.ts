import { OAuth2Client } from 'google-auth-library'
import { config } from '../config.js'

let client: OAuth2Client | null = null
function getClient() {
  if (!client) client = new OAuth2Client(config.googleClientId)
  return client
}

export interface GoogleProfile {
  googleId: string
  email: string
  emailVerified: boolean
  name: string
  picture?: string
}

export async function verifyGoogleIdToken(
  idToken: string,
): Promise<GoogleProfile> {
  const ticket = await getClient().verifyIdToken({
    idToken,
    audience: config.googleClientId,
  })

  const payload = ticket.getPayload()
  if (!payload || !payload.sub || !payload.email) {
    throw new Error('Invalid Google ID token payload')
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified ?? false,
    name: payload.name ?? payload.email.split('@')[0],
    picture: payload.picture,
  }
}
