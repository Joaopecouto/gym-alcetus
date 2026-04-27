import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Check,
  ChevronRight,
  Flag,
  Minus,
  Plus,
  SkipForward,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { useRestTimer } from '@/features/sessions/useRestTimer'
import { ExerciseImage } from '@/features/exercises/ExerciseImage'
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
import { pickWorkoutEndMessage } from '@/lib/motivational'
import { EQUIPMENT_LABELS, type Exercise, MUSCLE_COLORS } from '@/types'

interface SetDraft {
  weightKg: string
  reps: string
  // pra cardio: minutos como decimal (30 = 30min, 1.5 = 1m30s)
  durationMinutes: string
  distanceKm: string
  completed: boolean
  completedAt: number | null
}

interface ExerciseDraft {
  exerciseId: string
  workoutExerciseId: string
  sets: SetDraft[]
  restSeconds: number
  setsTarget: number
  repsMin: number
  repsMax: number
  durationSecondsTarget: number | null
  distanceKmTarget: number | null
}

type Mode = 'set' | 'rest'

export function SessionExecuteRoute() {
  const { id } = useParams() // session id
  const navigate = useNavigate()
  const qc = useQueryClient()

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
  const [exIdx, setExIdx] = useState(0)
  const [setIdx, setSetIdx] = useState(0)
  const [mode, setMode] = useState<Mode>('set')
  const [finishing, setFinishing] = useState(false)
  const [confirmExit, setConfirmExit] = useState(false)

  // Hidrata drafts
  useEffect(() => {
    if (!workoutQ.data) return
    setDrafts(
      workoutQ.data.exercises.map((we) => ({
        exerciseId: we.exerciseId,
        workoutExerciseId: we.id,
        restSeconds: we.restSeconds,
        setsTarget: we.setsTarget,
        repsMin: we.repsMin,
        repsMax: we.repsMax,
        durationSecondsTarget: we.durationSecondsTarget,
        distanceKmTarget: we.distanceKmTarget,
        sets: Array.from({ length: we.setsTarget }, () => ({
          weightKg: '',
          reps: '',
          durationMinutes: '',
          distanceKm: '',
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

  const current = drafts[exIdx]
  const currentExercise = current ? exById.get(current.exerciseId) : null

  const totalSetsAll = drafts.reduce((acc, d) => acc + d.sets.length, 0)
  const completedAll = drafts.reduce(
    (acc, d) => acc + d.sets.filter((s) => s.completed).length,
    0,
  )
  const overallProgress = totalSetsAll > 0 ? completedAll / totalSetsAll : 0

  function updateCurrentSet(patch: Partial<SetDraft>) {
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

  function addSet() {
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
                  durationMinutes: ex.sets.at(-1)?.durationMinutes ?? '',
                  distanceKm: ex.sets.at(-1)?.distanceKm ?? '',
                  completed: false,
                  completedAt: null,
                },
              ],
            }
          : ex,
      ),
    )
  }

  /** É a última série do último exercício? Usado pra mudar UI/comportamento no fim. */
  function isLastSetOverall(): boolean {
    return (
      !!current &&
      setIdx === current.sets.length - 1 &&
      exIdx === drafts.length - 1
    )
  }

  /** Marca a série atual como completa. Se for a última do treino, finaliza
   *  direto e vai pro SessionDetail (com motivacional, heatmap, exercícios) —
   *  pulamos o RestView de "treino concluído" porque o detalhe já tem essa UI
   *  bonita. Caso contrário, dispara o timer de descanso. */
  function completeAndRest() {
    updateCurrentSet({
      completed: true,
      completedAt: Date.now(),
    })
    if (isLastSetOverall()) {
      void finish()
      return
    }
    timer.start(current.restSeconds || 0)
    setMode('rest')
  }

  function advanceFromRest() {
    timer.stop()
    if (isLastSetOverall()) {
      // Acabou o treino → finaliza
      void finish()
      return
    }
    setMode('set')
    if (current && setIdx < current.sets.length - 1) {
      setSetIdx(setIdx + 1)
    } else if (exIdx < drafts.length - 1) {
      setExIdx(exIdx + 1)
      setSetIdx(0)
    }
  }

  function skipExercise() {
    timer.stop()
    if (exIdx < drafts.length - 1) {
      setExIdx(exIdx + 1)
      setSetIdx(0)
      setMode('set')
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
        durationSeconds: number | null
        distanceKm: number | null
        rpe?: number | null
        completed: boolean
        completedAt?: number | null
      }> = []
      let totalVolume = 0
      drafts.forEach((ex) => {
        ex.sets.forEach((s, idx) => {
          const w = Number(s.weightKg) || 0
          const r = Number(s.reps) || 0
          const durMin = Number(s.durationMinutes) || 0
          const distKm = Number(s.distanceKm) || 0
          const dur = durMin > 0 ? Math.round(durMin * 60) : null
          if (s.completed && w > 0 && r > 0) totalVolume += w * r
          sets.push({
            exerciseId: ex.exerciseId,
            setNumber: idx + 1,
            weightKg: w,
            reps: r,
            durationSeconds: dur,
            distanceKm: distKm > 0 ? distKm : null,
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
    timer.stop()
    if (id) void api.deleteSession(id).catch(() => {})
    navigate('/')
  }

  if (!current || !currentExercise) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Sem exercícios.</p>
      </div>
    )
  }

  const muscle = musclesQ.data?.find(
    (m) => m.id === currentExercise.primaryMuscleId,
  )
  const muscleColor =
    MUSCLE_COLORS[currentExercise.primaryMuscleId] ?? '#64748b'
  const currentSet = current.sets[setIdx]

  // Próxima referência (pra mostrar na tela de descanso)
  const nextSetIdx =
    setIdx < current.sets.length - 1 ? setIdx + 1 : 0
  const nextExerciseIdx =
    setIdx < current.sets.length - 1 ? exIdx : Math.min(exIdx + 1, drafts.length - 1)
  const nextDraft = drafts[nextExerciseIdx]
  const nextExercise = nextDraft ? exById.get(nextDraft.exerciseId) : null

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border bg-card">
        <div className="flex items-center gap-2 px-3 py-3">
          <button
            onClick={() => setConfirmExit(true)}
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
              {exIdx + 1}/{drafts.length} exercícios · {completedAll}/
              {totalSetsAll} séries · {Math.round(overallProgress * 100)}%
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

      <div className="flex-1 overflow-y-auto pb-32">
        {mode === 'set' ? (
          <SetView
            current={current}
            currentExercise={currentExercise}
            currentSet={currentSet}
            setIdx={setIdx}
            muscleName={muscle?.namePt ?? ''}
            muscleColor={muscleColor}
            equipmentLabel={
              EQUIPMENT_LABELS[currentExercise.equipment] ??
              currentExercise.equipment
            }
            onUpdateSet={updateCurrentSet}
            onComplete={completeAndRest}
            onAddSet={addSet}
            onSkipExercise={skipExercise}
            onJumpToSet={setSetIdx}
          />
        ) : (
          <RestView
            timer={timer}
            currentExercise={currentExercise}
            muscleColor={muscleColor}
            nextExercise={nextExercise ?? null}
            nextSetIdx={nextSetIdx}
            isLastSetOfExercise={setIdx === current.sets.length - 1}
            isWorkoutEnd={isLastSetOverall()}
            finishing={finishing}
            sessionId={id ?? ''}
            onSkip={advanceFromRest}
          />
        )}
      </div>

      <Dialog
        open={confirmExit}
        onClose={() => setConfirmExit(false)}
        title="Sair do treino?"
        description="Você não vai perder progresso só se finalizar pelo botão Finalizar. Sair agora descarta a sessão."
        actions={
          <>
            <Button variant="ghost" onClick={() => setConfirmExit(false)}>
              Continuar treinando
            </Button>
            <Button variant="destructive" onClick={abandon}>
              Sair sem salvar
            </Button>
          </>
        }
      />
    </div>
  )
}

function SetView({
  current,
  currentExercise,
  currentSet,
  setIdx,
  muscleName,
  muscleColor,
  equipmentLabel,
  onUpdateSet,
  onComplete,
  onAddSet,
  onSkipExercise,
  onJumpToSet,
}: {
  current: ExerciseDraft
  currentExercise: Exercise
  currentSet: SetDraft
  setIdx: number
  muscleName: string
  muscleColor: string
  equipmentLabel: string
  onUpdateSet: (patch: Partial<SetDraft>) => void
  onComplete: () => void
  onAddSet: () => void
  onSkipExercise: () => void
  onJumpToSet: (idx: number) => void
}) {
  const isCardio = currentExercise.kind === 'cardio'
  const w = Number(currentSet.weightKg) || 0
  const r = Number(currentSet.reps) || 0
  const oneRm = !isCardio && w && r ? Math.round(estimate1RM(w, r)) : null

  // alvo
  const target = isCardio
    ? formatCardioTarget(current.durationSecondsTarget, current.distanceKmTarget)
    : `${current.repsMin}–${current.repsMax} reps`

  // Habilita "Concluir" quando: strength precisa peso+reps; cardio precisa duração ou distância
  const canComplete = isCardio
    ? !!(currentSet.durationMinutes || currentSet.distanceKm)
    : !!(currentSet.weightKg && currentSet.reps)

  return (
    <div className="px-4 pt-4">
      <ExerciseImage
        exercise={currentExercise}
        size="lg"
        className="w-full"
      />

      <div className="mt-3">
        <p
          className="text-xs uppercase tracking-wider"
          style={{ color: muscleColor }}
        >
          {muscleName} · {equipmentLabel}
          {isCardio ? ' · CARDIO' : ''}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {currentExercise.name}
        </h1>
      </div>

      <details className="mt-2 rounded-lg bg-card text-sm">
        <summary className="cursor-pointer px-3 py-2 text-muted-foreground">
          Como executar
        </summary>
        <p className="px-3 pb-3 leading-relaxed">
          {currentExercise.instructions}
        </p>
      </details>

      {/* Mini chips de série/intervalo */}
      <div className="mt-4 flex items-center gap-1.5">
        {current.sets.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onJumpToSet(i)}
            className={cn(
              'flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-semibold tabular-nums transition',
              i === setIdx
                ? 'bg-primary text-primary-foreground'
                : s.completed
                  ? 'bg-primary/15 text-primary'
                  : 'border border-border text-muted-foreground',
            )}
            aria-label={`${isCardio ? 'Intervalo' : 'Série'} ${i + 1}`}
          >
            {s.completed ? <Check className="size-3.5" /> : i + 1}
          </button>
        ))}
        <button
          type="button"
          onClick={onAddSet}
          className="ml-1 flex size-7 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground hover:bg-accent"
          aria-label={isCardio ? 'Adicionar intervalo' : 'Adicionar série'}
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      {/* Card grande da série atual */}
      <div className="mt-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-baseline justify-between">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {isCardio ? 'Intervalo' : 'Série'} {setIdx + 1} de {current.sets.length}
          </p>
          <p className="text-xs text-muted-foreground">alvo: {target}</p>
        </div>

        {isCardio ? (
          <div className="mt-3 flex items-end gap-3">
            <div className="flex-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Duração (min)
              </label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                step="0.5"
                value={currentSet.durationMinutes}
                onChange={(e) =>
                  onUpdateSet({ durationMinutes: e.target.value })
                }
                className="h-14 w-full rounded-lg border border-input bg-background px-3 text-2xl font-semibold tabular-nums"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Distância (km)
              </label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                step="0.1"
                value={currentSet.distanceKm}
                onChange={(e) => onUpdateSet({ distanceKm: e.target.value })}
                className="h-14 w-full rounded-lg border border-input bg-background px-3 text-2xl font-semibold tabular-nums"
              />
            </div>
          </div>
        ) : (
          <div className="mt-3 flex items-end gap-3">
            <div className="flex-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Peso (kg)
              </label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={currentSet.weightKg}
                onChange={(e) => onUpdateSet({ weightKg: e.target.value })}
                className="h-14 w-full rounded-lg border border-input bg-background px-3 text-2xl font-semibold tabular-nums"
              />
            </div>
            <span className="pb-3 text-2xl text-muted-foreground">×</span>
            <div className="flex-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Reps
              </label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={currentSet.reps}
                onChange={(e) => onUpdateSet({ reps: e.target.value })}
                className="h-14 w-full rounded-lg border border-input bg-background px-3 text-2xl font-semibold tabular-nums"
              />
            </div>
          </div>
        )}

        {oneRm ? (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            ≈ {oneRm}kg de 1RM estimado
          </p>
        ) : null}

        {isCardio && currentSet.durationMinutes && currentSet.distanceKm ? (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            ≈{' '}
            {(
              Number(currentSet.distanceKm) /
              (Number(currentSet.durationMinutes) / 60)
            ).toFixed(1)}{' '}
            km/h
          </p>
        ) : null}
      </div>

      {/* Botões grandes */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 backdrop-blur safe-bottom">
        <div className="mx-auto flex max-w-2xl items-center gap-2 p-3">
          <Button variant="ghost" onClick={onSkipExercise} className="flex-1">
            <SkipForward className="size-4" />
            Pular exerc.
          </Button>
          <Button
            onClick={onComplete}
            disabled={!canComplete}
            className="flex-[2]"
            size="lg"
          >
            <Check className="size-4" />
            {isCardio ? 'Concluir intervalo' : 'Concluir série'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function formatCardioTarget(
  durationSeconds: number | null,
  distanceKm: number | null,
): string {
  const parts: string[] = []
  if (durationSeconds && durationSeconds > 0) {
    const min = Math.round(durationSeconds / 60)
    parts.push(`${min} min`)
  }
  if (distanceKm && distanceKm > 0) {
    parts.push(`${distanceKm} km`)
  }
  return parts.length > 0 ? parts.join(' · ') : 'sem alvo'
}

function RestView({
  timer,
  currentExercise,
  muscleColor,
  nextExercise,
  nextSetIdx,
  isLastSetOfExercise,
  isWorkoutEnd,
  finishing,
  sessionId,
  onSkip,
}: {
  timer: ReturnType<typeof useRestTimer>
  currentExercise: Exercise
  muscleColor: string
  nextExercise: Exercise | null
  nextSetIdx: number
  isLastSetOfExercise: boolean
  isWorkoutEnd: boolean
  finishing: boolean
  sessionId: string
  onSkip: () => void
}) {
  const finished = timer.remaining <= 0
  // Mensagem motivacional estável-pelo-id-da-sessão (mesma sessão = mesma msg).
  const endMsg = isWorkoutEnd ? pickWorkoutEndMessage(sessionId) : null

  return (
    <div className="flex h-full flex-col items-center justify-start px-4 pt-6">
      <div className="w-full text-center">
        <p
          className="text-xs uppercase tracking-wider"
          style={{ color: muscleColor }}
        >
          {isWorkoutEnd ? 'Treino concluído!' : 'Descansando'}
        </p>
        {isWorkoutEnd && endMsg ? (
          <>
            <p className="mt-2 text-lg font-semibold">{endMsg.praise}</p>
            <p
              className="mt-0.5 text-sm font-medium"
              style={{ color: muscleColor }}
            >
              {endMsg.closer}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Toque "Finalizar treino" pra salvar no histórico.
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            {isLastSetOfExercise &&
            nextExercise &&
            nextExercise !== currentExercise
              ? `Próxima: ${nextExercise.name}`
              : `Próxima: ${currentExercise.name} · série ${nextSetIdx + 1}`}
          </p>
        )}
      </div>

      {isWorkoutEnd ? (
        <div
          className="mt-8 flex size-56 items-center justify-center rounded-full border-8 text-6xl"
          style={{ borderColor: muscleColor, color: muscleColor }}
          aria-hidden="true"
        >
          ✓
        </div>
      ) : (
        <RestRing timer={timer} muscleColor={muscleColor} />
      )}

      {!isWorkoutEnd ? (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => timer.adjust(-15)}
            className="inline-flex h-11 items-center gap-1 rounded-full border border-border bg-card px-4 text-sm font-medium hover:bg-accent"
          >
            <Minus className="size-4" />
            15s
          </button>
          <button
            type="button"
            onClick={() => timer.adjust(15)}
            className="inline-flex h-11 items-center gap-1 rounded-full border border-border bg-card px-4 text-sm font-medium hover:bg-accent"
          >
            <Plus className="size-4" />
            15s
          </button>
        </div>
      ) : null}

      {nextExercise && !isWorkoutEnd ? (
        <div className="mt-8 w-full max-w-md rounded-2xl border border-border bg-card p-3">
          <div className="flex items-center gap-3">
            <ExerciseImage exercise={nextExercise} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                A seguir
              </p>
              <p className="truncate font-medium">{nextExercise.name}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 backdrop-blur safe-bottom">
        <div className="mx-auto flex max-w-2xl items-center gap-2 p-3">
          {isWorkoutEnd ? (
            <Button
              onClick={onSkip}
              className="w-full animate-pulse"
              size="lg"
              disabled={finishing}
            >
              <Flag className="size-4" />
              {finishing ? 'Salvando…' : 'Finalizar treino'}
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={onSkip} className="flex-1">
                <SkipForward className="size-4" />
                Pular descanso
              </Button>
              <Button
                onClick={onSkip}
                className={cn('flex-[2]', finished && 'animate-pulse')}
                size="lg"
              >
                <ChevronRight className="size-4" />
                {finished ? 'Próxima série' : 'Já estou pronto'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function RestRing({
  timer,
  muscleColor,
}: {
  timer: ReturnType<typeof useRestTimer>
  muscleColor: string
}) {
  const RADIUS = 90
  const STROKE = 12
  const C = 2 * Math.PI * RADIUS
  const offset = C * (1 - timer.progress)
  const remaining = timer.remaining
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  return (
    <div className="relative mt-6 size-56">
      <svg
        viewBox="0 0 220 220"
        className="size-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="110"
          cy="110"
          r={RADIUS}
          fill="none"
          stroke="var(--color-secondary)"
          strokeWidth={STROKE}
        />
        <circle
          cx="110"
          cy="110"
          r={RADIUS}
          fill="none"
          stroke={muscleColor}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.25s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-semibold tabular-nums">
          {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
        </span>
        <span className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
          {timer.durationSeconds}s prog.
        </span>
      </div>
    </div>
  )
}
