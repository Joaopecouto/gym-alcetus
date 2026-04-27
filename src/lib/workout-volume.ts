import type { Session, SessionWithSets, WorkoutWithExercises } from '@/types'

/**
 * Estimativa de volume (kg) pra um treino:
 * - Pra cada exercício, prefere o último peso usado em sessões finalizadas
 * - Senão, usa weightTargetKg do treino se setado
 * - Reps usadas: média entre repsMin e repsMax
 *
 * Retorna { kg, reps, sets } onde:
 * - kg é a soma de (peso × reps × séries) pra exercícios com peso conhecido
 * - reps é a soma total de repetições no treino
 * - sets é a soma total de séries
 */
export function estimateWorkoutVolume(
  workout: WorkoutWithExercises,
  history?: { sessions: Session[]; sessionsWithSets: SessionWithSets[] },
): { kg: number; reps: number; sets: number; hasKgEstimate: boolean } {
  let kg = 0
  let reps = 0
  let sets = 0
  let hasKgEstimate = false

  for (const we of workout.exercises ?? []) {
    sets += we.setsTarget
    const meanReps = (we.repsMin + we.repsMax) / 2
    reps += meanReps * we.setsTarget

    const lastWeight = findLastWeight(we.exerciseId, history)
    const weight = lastWeight ?? we.weightTargetKg
    if (weight && weight > 0) {
      kg += weight * meanReps * we.setsTarget
      hasKgEstimate = true
    }
  }

  return { kg, reps, sets, hasKgEstimate }
}

function findLastWeight(
  exerciseId: string,
  history?: { sessions: Session[]; sessionsWithSets: SessionWithSets[] },
): number | null {
  if (!history) return null
  // Sessões mais recentes primeiro (assume sessions[] já ordenado desc)
  for (const s of history.sessionsWithSets) {
    const setsForEx = s.sets.filter(
      (set) => set.exerciseId === exerciseId && set.completed && set.weightKg > 0,
    )
    if (setsForEx.length > 0) {
      return Math.max(...setsForEx.map((set) => set.weightKg))
    }
  }
  return null
}

/**
 * Soma volume de múltiplos treinos (pra estimar plano semanal).
 */
export function sumVolumes(
  volumes: ReturnType<typeof estimateWorkoutVolume>[],
) {
  return volumes.reduce(
    (acc, v) => ({
      kg: acc.kg + v.kg,
      reps: acc.reps + v.reps,
      sets: acc.sets + v.sets,
      hasKgEstimate: acc.hasKgEstimate || v.hasKgEstimate,
    }),
    { kg: 0, reps: 0, sets: 0, hasKgEstimate: false },
  )
}

export function formatVolume(volume: ReturnType<typeof estimateWorkoutVolume>) {
  if (volume.hasKgEstimate) {
    return volume.kg >= 1000
      ? `${(volume.kg / 1000).toFixed(1)}t`
      : `${Math.round(volume.kg)}kg`
  }
  return `${volume.sets} séries`
}
