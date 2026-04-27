import { closeDb, db, schema } from './client.js'
import { EXERCISES, MUSCLE_GROUPS } from './seed-data.js'

async function seed() {
  console.log('Semeando muscle_groups...')
  for (const mg of MUSCLE_GROUPS) {
    await db.insert(schema.muscleGroups).values(mg).onConflictDoNothing()
  }

  console.log(`Semeando ${EXERCISES.length} exercises...`)
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

  console.log('Seed OK.')
}

seed()
  .then(() => closeDb())
  .catch((err) => {
    console.error(err)
    closeDb()
    process.exit(1)
  })
