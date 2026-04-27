import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from '../config.js'
import * as schema from './schema.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_FOLDER = path.resolve(__dirname, '../../drizzle')

// libsql aceita URL no formato `file:caminho` (relativo ou absoluto).
function buildUrl(p: string): string {
  if (p.startsWith('file:') || p.startsWith('libsql:') || p.startsWith('http')) {
    return p
  }
  return `file:${path.resolve(p)}`
}

const client: Client = createClient({ url: buildUrl(config.dbPath) })

export const db = drizzle(client, { schema })
export { schema }

export async function runMigrations() {
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER })
}

export function closeDb() {
  client.close()
}
