import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, Weight } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useSession } from '@/features/sessions/queries'
import { useWorkout } from '@/features/workouts/queries'
import {
  useExercises,
  useMuscleGroups,
} from '@/features/exercises/queries'
import { MUSCLE_COLORS } from '@/types'
import { estimate1RM } from '@/lib/calc-1rm'

export function SessionDetailRoute() {
  const { id } = useParams()
  const sessionQ = useSession(id)
  const workoutQ = useWorkout(sessionQ.data?.workoutId)
  const exercisesQ = useExercises()
  const musclesQ = useMuscleGroups()

  if (sessionQ.isLoading || !sessionQ.data) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const s = sessionQ.data
  const date = new Date(s.startedAt)
  const exById = new Map(exercisesQ.data?.map((e) => [e.id, e]))
  const muById = new Map(musclesQ.data?.map((m) => [m.id, m]))

  // Agrupa séries por exerciseId preservando ordem do workout
  const order: string[] = workoutQ.data?.exercises.map((we) => we.exerciseId) ?? []
  const setsByExercise = new Map<string, typeof s.sets>()
  for (const set of s.sets) {
    const arr = setsByExercise.get(set.exerciseId) ?? []
    arr.push(set)
    setsByExercise.set(set.exerciseId, arr)
  }

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 px-2 pt-3">
        <Link
          to="/history"
          className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-5" />
        </Link>
      </div>

      <div className="px-4 pt-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {workoutQ.data?.name ?? 'Treino'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {format(date, "EEEE, d 'de' MMMM 'de' y · HH:mm", { locale: ptBR })}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              Duração
            </div>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {fmtDuration(s.durationSeconds ?? 0)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Weight className="size-3.5" />
              Volume
            </div>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {Math.round(s.totalVolumeKg ?? 0)} kg
            </p>
          </div>
        </div>
      </div>

      <ul className="mt-6 space-y-3 px-4">
        {order.map((exId) => {
          const ex = exById.get(exId)
          const sets = setsByExercise.get(exId) ?? []
          if (!ex || sets.length === 0) return null
          const muscle = muById.get(ex.primaryMuscleId)
          return (
            <li
              key={exId}
              className="rounded-xl border border-border bg-card p-3"
            >
              <div className="flex items-center gap-2">
                <div
                  className="size-8 shrink-0 rounded-md"
                  style={{
                    backgroundColor:
                      MUSCLE_COLORS[ex.primaryMuscleId] ?? '#64748b',
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{ex.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {muscle?.namePt}
                  </p>
                </div>
              </div>
              <ul className="mt-2 space-y-1">
                {sets.map((set) => {
                  const oneRm =
                    set.weightKg && set.reps
                      ? Math.round(estimate1RM(set.weightKg, set.reps))
                      : null
                  return (
                    <li
                      key={set.id}
                      className="flex items-center gap-2 rounded bg-secondary/50 px-2 py-1 text-sm"
                    >
                      <span className="size-6 text-center text-xs text-muted-foreground">
                        {set.setNumber}
                      </span>
                      <span className="tabular-nums">
                        {set.weightKg}kg × {set.reps}
                      </span>
                      {oneRm ? (
                        <span className="ml-auto text-xs text-muted-foreground">
                          ≈{oneRm}kg 1RM
                        </span>
                      ) : null}
                      {!set.completed ? (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (não concluída)
                        </span>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function fmtDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h${m.toString().padStart(2, '0')}`
  if (m > 0) return `${m}min ${s}s`
  return `${s}s`
}
