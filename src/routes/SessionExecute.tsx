import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Flag,
  Minus,
  Pause,
  Plus,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useRestTimer } from '@/features/sessions/useRestTimer'
import {
  useExercises,
  useMuscleGroups,
} from '@/features/exercises/queries'
import { useWorkout } from '@/features/workouts/queries'
import { api } from '@/lib/api'
import { estimate1RM } from '@/lib/calc-1rm'
import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query'
import { EQUIPMENT_LABELS, MUSCLE_COLORS } from '@/types'

interface SetDraft {
  weightKg: string
  reps: string
  completed: boolean
  completedAt: number | null
}

interface ExerciseDraft {
  exerciseId: string
  workoutExerciseId: string
  sets: SetDraft[]
  restSeconds: number
}

export function SessionExecuteRoute() {
  const { id } = useParams() // session id
  const navigate = useNavigate()
  const qc = useQueryClient()

  // O id da rota é o session id; precisamos saber o workoutId.
  // Passamos workoutId via state quando navegamos, mas pra robustez
  // vamos buscar a session.
  const [workoutId, setWorkoutId] = useState<string | null>(null)
  const [startedAt] = useState(() => Date.now())

  useEffect(() => {
    if (!id) return
    api
      .getSession(id)
      .then((s) => setWorkoutId(s.workoutId))
      .catch(() => {})
  }, [id])

  const workoutQ = useWorkout(workoutId ?? undefined)
  const exercisesQ = useExercises()
  const musclesQ = useMuscleGroups()
  const timer = useRestTimer()

  const [drafts, setDrafts] = useState<ExerciseDraft[]>([])
  const [focusIdx, setFocusIdx] = useState(0)
  const [finishing, setFinishing] = useState(false)

  // Hidrata drafts a partir do workout
  useEffect(() => {
    if (!workoutQ.data) return
    setDrafts(
      workoutQ.data.exercises.map((we) => ({
        exerciseId: we.exerciseId,
        workoutExerciseId: we.id,
        restSeconds: we.restSeconds,
        sets: Array.from({ length: we.setsTarget }, () => ({
          weightKg: '',
          reps: '',
          completed: false,
          completedAt: null,
        })),
      })),
    )
  }, [workoutQ.data])

  const exById = useMemo(
    () => new Map(exercisesQ.data?.map((e) => [e.id, e])),
    [exercisesQ.data],
  )

  if (!workoutQ.data || !workoutId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const current = drafts[focusIdx]
  const currentExercise = current ? exById.get(current.exerciseId) : null
  const currentMuscle = currentExercise
    ? musclesQ.data?.find((m) => m.id === currentExercise.primaryMuscleId)
    : null

  function updateSet(exIdx: number, setIdx: number, patch: Partial<SetDraft>) {
    setDrafts((d) =>
      d.map((ex, i) =>
        i === exIdx
          ? {
              ...ex,
              sets: ex.sets.map((s, si) =>
                si === setIdx ? { ...s, ...patch } : s,
              ),
            }
          : ex,
      ),
    )
  }

  function addSet(exIdx: number) {
    setDrafts((d) =>
      d.map((ex, i) =>
        i === exIdx
          ? {
              ...ex,
              sets: [
                ...ex.sets,
                {
                  weightKg: ex.sets.at(-1)?.weightKg ?? '',
                  reps: ex.sets.at(-1)?.reps ?? '',
                  completed: false,
                  completedAt: null,
                },
              ],
            }
          : ex,
      ),
    )
  }

  function toggleSet(exIdx: number, setIdx: number) {
    const ex = drafts[exIdx]
    const set = ex.sets[setIdx]
    const wasCompleted = set.completed
    updateSet(exIdx, setIdx, {
      completed: !wasCompleted,
      completedAt: !wasCompleted ? Date.now() : null,
    })
    if (!wasCompleted && ex.restSeconds > 0) {
      timer.start(ex.restSeconds)
    }
  }

  async function finish() {
    if (!id) return
    setFinishing(true)
    try {
      const finishedAt = Date.now()
      const durationSeconds = Math.round((finishedAt - startedAt) / 1000)
      const sets: Array<{
        exerciseId: string
        setNumber: number
        weightKg: number
        reps: number
        rpe?: number | null
        completed: boolean
        completedAt?: number | null
      }> = []
      let totalVolume = 0
      drafts.forEach((ex) => {
        ex.sets.forEach((s, idx) => {
          const w = Number(s.weightKg) || 0
          const r = Number(s.reps) || 0
          if (s.completed && w > 0 && r > 0) {
            totalVolume += w * r
          }
          sets.push({
            exerciseId: ex.exerciseId,
            setNumber: idx + 1,
            weightKg: w,
            reps: r,
            rpe: null,
            completed: s.completed,
            completedAt: s.completedAt,
          })
        })
      })

      await api.finishSession(id, {
        finishedAt,
        durationSeconds,
        totalVolumeKg: totalVolume,
        notes: '',
        sets,
      })
      timer.stop()
      qc.invalidateQueries({ queryKey: queryKeys.sessions })
      navigate(`/history/${id}`)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Falha ao finalizar')
      setFinishing(false)
    }
  }

  function abandon() {
    if (!confirm('Sair sem salvar este treino?')) return
    timer.stop()
    if (id) {
      void api.deleteSession(id).catch(() => {})
    }
    navigate('/')
  }

  if (!current || !currentExercise) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Sem exercícios.</p>
      </div>
    )
  }

  const completedSets = current.sets.filter((s) => s.completed).length
  const totalSetsAll = drafts.reduce((acc, d) => acc + d.sets.length, 0)
  const completedAll = drafts.reduce(
    (acc, d) => acc + d.sets.filter((s) => s.completed).length,
    0,
  )
  const overallProgress = totalSetsAll > 0 ? completedAll / totalSetsAll : 0

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border bg-card">
        <div className="flex items-center gap-2 px-3 py-3">
          <button
            onClick={abandon}
            className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
            aria-label="Sair"
          >
            <X className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {workoutQ.data.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {focusIdx + 1} de {drafts.length} exercícios ·{' '}
              {Math.round(overallProgress * 100)}%
            </p>
          </div>
          <button
            onClick={finish}
            disabled={finishing}
            className="inline-flex h-9 items-center gap-1 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground"
          >
            <Flag className="size-3.5" />
            {finishing ? 'Salvando…' : 'Finalizar'}
          </button>
        </div>
        <div className="h-1 bg-secondary">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${overallProgress * 100}%` }}
          />
        </div>
      </header>

      {timer.active ? <RestBar timer={timer} /> : null}

      <div className="flex-1 overflow-y-auto pb-32">
        <div className="px-4 pt-4">
          <div
            className="flex items-center justify-center rounded-2xl py-6 text-center"
            style={{
              backgroundColor: `${MUSCLE_COLORS[currentExercise.primaryMuscleId] ?? '#64748b'}30`,
            }}
          >
            <div>
              <p
                className="text-xs uppercase tracking-wider"
                style={{
                  color:
                    MUSCLE_COLORS[currentExercise.primaryMuscleId] ?? '#64748b',
                }}
              >
                {currentMuscle?.namePt} ·{' '}
                {EQUIPMENT_LABELS[currentExercise.equipment] ??
                  currentExercise.equipment}
              </p>
              <h1 className="mt-1 px-4 text-2xl font-semibold tracking-tight">
                {currentExercise.name}
              </h1>
            </div>
          </div>

          <details className="mt-3 rounded-lg bg-card text-sm">
            <summary className="cursor-pointer px-3 py-2 text-muted-foreground">
              Como executar
            </summary>
            <p className="px-3 pb-3 leading-relaxed">
              {currentExercise.instructions}
            </p>
          </details>
        </div>

        <div className="mt-4 px-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Séries ({completedSets}/{current.sets.length})
            </h2>
            <button
              type="button"
              onClick={() => addSet(focusIdx)}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-xs hover:bg-accent"
            >
              <Plus className="size-3" />
              Série
            </button>
          </div>

          <ul className="mt-2 space-y-1.5">
            {current.sets.map((s, idx) => {
              const w = Number(s.weightKg) || 0
              const r = Number(s.reps) || 0
              const oneRm = w && r ? Math.round(estimate1RM(w, r)) : null
              return (
                <li
                  key={idx}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border p-2 transition-colors',
                    s.completed
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border bg-card',
                  )}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold tabular-nums">
                    {idx + 1}
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="kg"
                    value={s.weightKg}
                    onChange={(e) =>
                      updateSet(focusIdx, idx, { weightKg: e.target.value })
                    }
                    className="h-9 w-20 rounded-md border border-input bg-background px-2 text-center tabular-nums"
                  />
                  <span className="text-muted-foreground">×</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="reps"
                    value={s.reps}
                    onChange={(e) =>
                      updateSet(focusIdx, idx, { reps: e.target.value })
                    }
                    className="h-9 w-20 rounded-md border border-input bg-background px-2 text-center tabular-nums"
                  />
                  {oneRm ? (
                    <span className="hidden text-xs text-muted-foreground sm:inline">
                      ≈{oneRm}kg 1RM
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => toggleSet(focusIdx, idx)}
                    className={cn(
                      'ml-auto flex size-9 items-center justify-center rounded-full transition',
                      s.completed
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border text-muted-foreground hover:bg-accent',
                    )}
                    aria-pressed={s.completed}
                    aria-label={s.completed ? 'Desmarcar' : 'Marcar feito'}
                  >
                    <Check className="size-4" />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 backdrop-blur safe-bottom">
        <div className="mx-auto flex max-w-2xl items-center gap-2 p-3">
          <Button
            variant="ghost"
            onClick={() => setFocusIdx((i) => Math.max(0, i - 1))}
            disabled={focusIdx === 0}
            className="flex-1"
          >
            <ChevronLeft className="size-4" />
            Anterior
          </Button>
          <Button
            onClick={() =>
              setFocusIdx((i) => Math.min(drafts.length - 1, i + 1))
            }
            disabled={focusIdx === drafts.length - 1}
            className="flex-1"
          >
            Próximo
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </nav>
    </div>
  )
}

function RestBar({
  timer,
}: {
  timer: ReturnType<typeof useRestTimer>
}) {
  return (
    <div className="border-b border-primary/30 bg-primary/10">
      <div className="mx-auto flex max-w-2xl items-center gap-3 p-3">
        <button
          type="button"
          onClick={() => timer.adjust(-15)}
          className="flex size-8 items-center justify-center rounded-full bg-background text-foreground"
          aria-label="-15s"
        >
          <Minus className="size-4" />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="text-xs uppercase tracking-wider text-primary">
            Descanso
          </p>
          <p className="text-2xl font-semibold tabular-nums">
            {Math.floor(timer.remaining / 60)
              .toString()
              .padStart(2, '0')}
            :{(timer.remaining % 60).toString().padStart(2, '0')}
          </p>
          <div className="mt-1 h-1 rounded-full bg-background">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${timer.progress * 100}%` }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => timer.adjust(15)}
          className="flex size-8 items-center justify-center rounded-full bg-background text-foreground"
          aria-label="+15s"
        >
          <Plus className="size-4" />
        </button>
        <button
          type="button"
          onClick={timer.stop}
          className="flex size-8 items-center justify-center rounded-full bg-background text-foreground"
          aria-label="Parar"
        >
          <Pause className="size-4" />
        </button>
      </div>
    </div>
  )
}
