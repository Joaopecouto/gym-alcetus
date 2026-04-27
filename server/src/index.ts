import 'dotenv/config'
import Fastify from 'fastify'
import fastifyCookie from '@fastify/cookie'
import fastifyStatic from '@fastify/static'
import fs from 'node:fs'
import path from 'node:path'
import { config, isProd } from './config.js'
import { closeDb, db, runMigrations, schema } from './db/client.js'
import { EXERCISES, MUSCLE_GROUPS } from './db/seed-data.js'
import { loadUser } from './auth/middleware.js'
import { authRoutes } from './routes/auth.js'
import { meRoutes } from './routes/me.js'
import { catalogRoutes } from './routes/catalog.js'
import { workoutRoutes } from './routes/workouts.js'
import { sessionRoutes } from './routes/sessions.js'
import { planRoutes } from './routes/plans.js'
import { devRoutes } from './routes/dev.js'

const app = Fastify({
  logger: {
    level: isProd() ? 'info' : 'debug',
    transport: isProd()
      ? undefined
      : { target: 'pino-pretty', options: { colorize: true } },
  },
  trustProxy: true,
})

// ----- migrations + seed on boot -----
try {
  await runMigrations()
  app.log.info('migrations ok')

  // Auto-seed: se a tabela de exercícios estiver vazia, popula com o catálogo
  // oficial. Idempotente — só roda no primeiro boot ou em DB recém-criado.
  const existing = await db.select().from(schema.exercises).limit(1)
  if (existing.length === 0) {
    app.log.info('seeding catalog (first boot)...')
    for (const mg of MUSCLE_GROUPS) {
      await db.insert(schema.muscleGroups).values(mg).onConflictDoNothing()
    }
    for (const e of EXERCISES) {
      await db
        .insert(schema.exercises)
        .values({
          id: e.id,
          ownerId: null,
          name: e.name,
          primaryMuscleId: e.primaryMuscle,
          secondaryMuscles: e.secondaryMuscles,
          equipment: e.equipment,
          difficulty: e.difficulty,
          instructions: e.instructions,
          imagePath: null,
          isCustom: false,
        })
        .onConflictDoNothing()
    }
    app.log.info(`seed ok: ${EXERCISES.length} exercícios`)
  }

  // Auto-detecta imagens em config.exerciseImagesDir e popula imagePath.
  // Convenção: nome do arquivo = id do exercício + extensão (ex: ex-bench-press.gif)
  if (fs.existsSync(config.exerciseImagesDir)) {
    const { eq } = await import('drizzle-orm')
    const files = fs.readdirSync(config.exerciseImagesDir)
    let updated = 0
    for (const filename of files) {
      const match = filename.match(/^(.+)\.(gif|png|jpg|jpeg|webp|svg)$/i)
      if (!match) continue
      const id = match[1]
      const result = await db
        .update(schema.exercises)
        .set({ imagePath: `/exercise-images/${filename}` })
        .where(eq(schema.exercises.id, id))
      if (result.rowsAffected > 0) updated++
    }
    if (updated > 0) {
      app.log.info(`imagePath atualizado pra ${updated} exercícios`)
    }
  }
} catch (err) {
  app.log.error({ err }, 'migrations/seed failed')
  process.exit(1)
}

// ----- plugins -----
await app.register(fastifyCookie)

app.addHook('preHandler', loadUser)

// ----- routes (API) -----
await app.register(authRoutes)
await app.register(meRoutes)
await app.register(catalogRoutes)
await app.register(workoutRoutes)
await app.register(sessionRoutes)
await app.register(planRoutes)

if (!isProd()) {
  app.log.warn('NODE_ENV != production — registrando /api/dev/bypass (NÃO use em prod)')
  await app.register(devRoutes)
}

app.get('/api/health', async () => ({ ok: true, ts: Date.now() }))

// ----- static: imagens dos exercícios -----
// Pasta separada do build do frontend, persistida em volume Docker.
// Cache agressivo (1 ano) — os arquivos são imutáveis (versionar via filename).
if (fs.existsSync(config.exerciseImagesDir)) {
  await app.register(fastifyStatic, {
    root: config.exerciseImagesDir,
    prefix: '/exercise-images/',
    wildcard: false,
    decorateReply: false,
    maxAge: 1000 * 60 * 60 * 24 * 365,
    immutable: true,
  })
} else {
  app.log.info(
    `exercise images dir não existe (${config.exerciseImagesDir}). Crie e adicione arquivos pra servir.`,
  )
}

// ----- static SPA + history fallback -----
const staticDir = config.staticDir
const indexHtmlPath = path.join(staticDir, 'index.html')
const hasFrontendBuild = fs.existsSync(indexHtmlPath)

if (hasFrontendBuild) {
  await app.register(fastifyStatic, {
    root: staticDir,
    prefix: '/',
    wildcard: false,
    decorateReply: false,
  })

  // SPA fallback: qualquer GET que não bateu em /api ou arquivo estático,
  // serve index.html pra deixar o React Router cuidar do roteamento.
  app.setNotFoundHandler((req, reply) => {
    if (req.method !== 'GET' || req.url.startsWith('/api/')) {
      return reply.code(404).send({ error: 'not_found' })
    }
    return reply.type('text/html').sendFile('index.html')
  })
} else {
  app.log.warn(
    `Frontend build não encontrado em ${staticDir}. Rode \`npm run build\` na raiz e reinicie o server.`,
  )
}

// ----- start -----
const shutdown = async (signal: string) => {
  app.log.info({ signal }, 'shutting down')
  try {
    await app.close()
  } finally {
    closeDb()
    process.exit(0)
  }
}
process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))

try {
  await app.listen({ port: config.port, host: config.host })
} catch (err) {
  app.log.error({ err }, 'failed to start server')
  process.exit(1)
}
