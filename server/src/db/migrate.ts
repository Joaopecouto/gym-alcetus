import { closeDb, runMigrations } from './client.js'

console.log('Rodando migrations...')
await runMigrations()
console.log('Migrations OK.')
closeDb()
