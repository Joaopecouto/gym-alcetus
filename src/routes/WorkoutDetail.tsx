import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Play, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  useDeleteWorkout,
  useWorkout,
} from '@/features/workouts/queries'
import {
  useExercises,
  useMuscleGroups,
} from '@/features/exercises/queries'
import { api } from '@/lib/api'
import { EQUIPMENT_LABELS, MUSCLE_COLORS } from '@/types'

export function WorkoutDetailRoute() {
  const { id } = useParams()
  const navigate = useNavigate()
  const workoutQ = useWorkout(id)
  const exercisesQ = useExercises()
  const musclesQ = useMuscleGroups()
  const deleteW = useDeleteWorkout()

  if (workoutQ.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }
  if (!workoutQ.data) {
    return (
      <div className="p-6 text-center">
        <p>Treino não encontrado.</p>
        <Link to="/workouts" className="mt-2 inline-block text-primary">
          Voltar
        </Link>
      </div>
    )
  }

  const w = workoutQ.data
  const exById = new Map(exercisesQ.data?.map((e) => [e.id, e]))
  const muById = new Map(musclesQ.data?.map((m) => [m.id, m]))

  async function start() {
    if (!w.id) return
    const sessionId = await api.startSession(w.id)
    navigate(`/session/${sessionId}`)
  }

  async function remove() {
    if (!confirm(`Apagar "${w.name}"?`)) return
    await deleteW.mutateAsync(w.id)
    navigate('/workouts')
  }

  return (
    <div className="pb-24">
      <div className="flex items-center gap-2 px-2 pt-3">
        <Link
          to="/workouts"
          className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <Link
          to={`/workouts/${w.id}/edit`}
          className="ml-auto inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
          aria-label="Editar"
        >
          <Pencil className="size-4" />
        </Link>
        <button
          onClick={remove}
          className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          aria-label="Apagar"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="px-4 pt-3">
        <h1 className="text-2xl font-semibold tracking-tight">{w.name}</h1>
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
            {w.mode === 'strength' ? 'Força' : 'Hipertrofia'}
          </span>
          <span>{w.exercises.length} exercícios</span>
        </div>
      </div>

      <ul className="mt-5 space-y-2 px-4">
        {w.exercises.map((we, idx) => {
          const ex = exById.get(we.exerciseId)
          const mu = ex ? muById.get(ex.primaryMuscleId) : null
          return (
            <li
              key={we.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-md text-xs font-semibold text-white"
                style={{
                  backgroundColor:
                    MUSCLE_COLORS[ex?.primaryMuscleId ?? ''] ?? '#64748b',
                }}
              >
                {idx + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {ex?.name ?? we.exerciseId}
                </p>
                <p className="text-xs text-muted-foreground">
                  {we.setsTarget}×{we.repsMin}–{we.repsMax} ·{' '}
                  {Math.round(we.restSeconds / 60) >= 1
                    ? `${Math.round(we.restSeconds / 60)}min`
                    : `${we.restSeconds}s`}{' '}
                  descanso
                  {mu ? ` · ${mu.namePt}` : ''}
                  {ex ? ` · ${EQUIPMENT_LABELS[ex.equipment] ?? ex.equipment}` : ''}
                </p>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 backdrop-blur safe-bottom">
        <div className="mx-auto max-w-2xl p-4">
          <Button onClick={start} size="lg" className="w-full">
            <Play className="size-4" />
            Iniciar treino agora
          </Button>
        </div>
      </div>
    </div>
  )
}
