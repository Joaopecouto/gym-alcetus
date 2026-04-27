import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { EXERCISES, IMAGE_HINTS } from '../src/db/seed-data.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const SOURCE_JSON_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json'
const IMAGES_BASE_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'
const OUTPUT_DIR = path.resolve(__dirname, '../data/exercise-images')

interface SourceExercise {
  id: string
  name: string
  images?: string[]
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

async function downloadBinary(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

async function main() {
  console.log('==> Baixando catálogo do free-exercise-db…')
  const res = await fetch(SOURCE_JSON_URL)
  if (!res.ok) {
    console.error(`Falha ao baixar catálogo: HTTP ${res.status}`)
    process.exit(1)
  }
  const sourceList = (await res.json()) as SourceExercise[]
  console.log(`    ${sourceList.length} exercícios disponíveis na fonte.`)

  const byId = new Map(sourceList.map((s) => [s.id, s]))
  const byNormId = new Map(sourceList.map((s) => [normalize(s.id), s]))
  const byNormName = new Map(sourceList.map((s) => [normalize(s.name), s]))

  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  const skipExisting = process.argv.includes('--skip-existing')
  const dryRun = process.argv.includes('--dry-run')

  const stats = { ok: 0, miss: 0, fail: 0, skip: 0 }
  const missing: string[] = []

  for (const ex of EXERCISES) {
    const hint = IMAGE_HINTS[ex.id]
    if (!hint) {
      console.log(`  ! ${ex.id.padEnd(28)} — sem imageHint`)
      stats.miss++
      missing.push(ex.id)
      continue
    }

    let match = byId.get(hint)
    if (!match) match = byNormId.get(normalize(hint))
    if (!match) match = byNormName.get(normalize(hint))

    if (!match || !match.images?.[0]) {
      console.log(
        `  ! ${ex.id.padEnd(28)} — hint "${hint}" não bate com nada na fonte`,
      )
      stats.miss++
      missing.push(`${ex.id} (hint=${hint})`)
      continue
    }

    const outFile = path.join(OUTPUT_DIR, `${ex.id}.jpg`)
    if (skipExisting) {
      try {
        await fs.access(outFile)
        console.log(`  - ${ex.id.padEnd(28)} — já existe, pulando`)
        stats.skip++
        continue
      } catch {
        /* não existe — segue */
      }
    }

    if (dryRun) {
      console.log(
        `  ✓ ${ex.id.padEnd(28)} → ${match.id} (dry-run, sem download)`,
      )
      stats.ok++
      continue
    }

    const imageUrl = IMAGES_BASE_URL + match.images[0]
    try {
      const buf = await downloadBinary(imageUrl)
      await fs.writeFile(outFile, buf)
      const kb = (buf.length / 1024).toFixed(0)
      console.log(`  ✓ ${ex.id.padEnd(28)} → ${match.id} (${kb}KB)`)
      stats.ok++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`  ! ${ex.id.padEnd(28)} — download falhou: ${msg}`)
      stats.fail++
      missing.push(`${ex.id} (download)`)
    }
  }

  console.log()
  console.log(
    `Resultado: ${stats.ok} OK, ${stats.skip} pulados, ${stats.miss} sem match, ${stats.fail} falhas de rede`,
  )
  if (missing.length > 0) {
    console.log(`\nExercícios sem imagem:`)
    for (const m of missing) console.log(`  • ${m}`)
    console.log(
      `\nAjuste os hints em server/src/db/seed-data.ts (IMAGE_HINTS) e rode de novo.`,
    )
  }
  console.log(`\nArquivos em ${OUTPUT_DIR}`)
  console.log(
    `Pra ativar, reinicie o server (Docker compose up -d) — o boot detecta os arquivos e popula imagePath automaticamente.`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
