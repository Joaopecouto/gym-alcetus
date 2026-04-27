import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required env var: ${name}. See server/.env.example for the full list.`,
    )
  }
  return value
}

export const config = {
  port: Number(optional('PORT', '3000')),
  host: optional('HOST', '0.0.0.0'),
  nodeEnv: optional('NODE_ENV', 'development'),

  // Lazy getters — só valida quando o código tentar usar.
  // Isso permite rodar `db:migrate` e `db:seed` sem env de auth setado.
  get googleClientId() {
    return requireEnv('GOOGLE_CLIENT_ID')
  },
  get jwtSecret() {
    return requireEnv('JWT_SECRET')
  },

  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  cookieSecure: optional('COOKIE_SECURE', 'true') === 'true',

  dbPath: optional(
    'DB_PATH',
    path.resolve(__dirname, '../data/iron-track.db'),
  ),
  staticDir: optional(
    'STATIC_DIR',
    path.resolve(__dirname, '../../dist'),
  ),
  exerciseImagesDir: optional(
    'EXERCISE_IMAGES_DIR',
    path.resolve(__dirname, '../data/exercise-images'),
  ),
}

export function isProd() {
  return config.nodeEnv === 'production'
}
