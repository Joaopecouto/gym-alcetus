import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  GripVertical,
  Plus,
  Sparkles,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { ScrollRow } from '@/components/ui/ScrollRow'
import {
  useCreateWorkout,
  useUpdateWorkout,
  useWorkout,
  useWorkoutTemplates,
} from '@/features/workouts/queries'
import {
  useExercises,
  useMuscleGroups,
} from '@/features/exercises/queries'
import { cn } from '@/lib/utils'
import {
  EQUIPMENT_LABELS,
  MUSCLE_COLORS,
  type Exercise,
  type WorkoutInput,
  type WorkoutMode,
} from '@/types'

interface DraftExercise {
  exerciseId: string
  setsTarget: number
  repsMin: number
  repsMax: number
  restSeconds: number
  durationSecondsTarget: number | null
  distanceKmTarget: number | null
  notes: string
}

const HYP_DEFAULTS = { setsTarget: 4, repsMin: 8, repsMax: 12, restSeconds: 75 }
const STR_DEFAULTS = { setsTarget: 5, repsMin: 3, repsMax: 6, restSeconds: 180 }
const CARDIO_DEFAULTS = {
  setsTarget: 1,
  repsMin: 0,
  repsMax: 0,
  restSeconds: 0,
  durationSecondsTarget: 30 * 60, // 30 min default
  distanceKmTarget: null,
}

export function WorkoutEditorRoute() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()

  const existing = useWorkout(id)
  const exercisesQ = useExercises()
  const musclesQ = useMuscleGroups()
  const templatesQ = useWorkoutTemplates()
  const create = useCreateWorkout()
  const update = useUpdateWorkout()

  const [name, setName] = useState('')
  const [mode, setMode] = useState<WorkoutMode>('hypertrophy')
  const [draft, setDraft] = useState<DraftExercise[]>([])
  const [picker, setPicker] = useState(false)
  const [templatePicker, setTemplatePicker] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Hidrata o form quando carregar o existente
  useEffect(() => {
    if (existing.data) {
      setName(existing.data.name)
      setMode(existing.data.mode)
      setDraft(
        existing.data.exercises.map((e) => ({
          exerciseId: e.exerciseId,
          setsTarget: e.setsTarget,
          repsMin: e.repsMin,
          repsMax: e.repsMax,
          restSeconds: e.restSeconds,
          durationSecondsTarget: e.durationSecondsTarget,
          distanceKmTarget: e.distanceKmTarget,
          notes: e.notes,
        })),
      )
    }
  }, [existing.data])

  const exById = useMemo(() => {
    const map = new Map<string, Exercise>()
    for (const e of exercisesQ.data ?? []) map.set(e.id, e)
    return map
  }, [exercisesQ.data])

  function addExercise(exId: string) {
    const ex = exById.get(exId)
    const isCardio = ex?.kind === 'cardio'
    const defaults = isCardio
      ? CARDIO_DEFAULTS
      : mode === 'strength'
        ? { ...STR_DEFAULTS, durationSecondsTarget: null, distanceKmTarget: null }
        : { ...HYP_DEFAULTS, durationSecondsTarget: null, distanceKmTarget: null }
    setDraft((d) => [...d, { exerciseId: exId, ...defaults, notes: '' }])
    setPicker(false)
  }

  function applyTemplate(tplId: string) {
    const tpl = templatesQ.data?.find((t) => t.id === tplId)
    if (!tpl) return
    if (!name.trim()) setName(tpl.name)
    setMode(tpl.mode)
    setDraft(
      tpl.exercises.map((e) => ({
        exerciseId: e.exerciseId,
        setsTarget: e.setsTarget,
        repsMin: e.repsMin,
        repsMax: e.repsMax,
        restSeconds: e.restSeconds,
        durationSecondsTarget: null,
        distanceKmTarget: null,
        notes: '',
      })),
    )
    setTemplatePicker(false)
  }

  function updateExercise(idx: number, patch: Partial<DraftExercise>) {
    setDraft((d) => d.map((e, i) => (i === idx ? { ...e, ...patch } : e)))
  }

  function removeExercise(idx: number) {
    setDraft((d) => d.filter((_, i) => i !== idx))
  }

  function move(idx: number, dir: -1 | 1) {
    setDraft((d) => {
      const next = [...d]
      const target = idx + dir
      if (target < 0 || target >= next.length) return d
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }

  async function save() {
    if (!name.trim()) {
      setError('Dá um nome pro treino.')
      return
    }
    if (draft.length === 0) {
      setError('Adiciona pelo menos um exercício.')
      return
    }
    setError(null)
    const payload: WorkoutInput = {
      name: name.trim(),
      mode,
      notes: '',
      exercises: draft,
    }
    try {
      if (isEdit && id) {
        await update.mutateAsync({ id, payload })
        navigate(`/workouts/${id}`)
      } else {
        const w = await create.mutateAsync(payload)
        navigate(`/workouts/${w.id}`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao salvar.')
    }
  }

  return (
    <div className="pb-32">
      <div className="flex items-center gap-2 px-2 pt-3">
        <Link
          to={isEdit && id ? `/workouts/${id}` : '/workouts'}
          className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-semibold">
          {isEdit ? 'Editar treino' : 'Novo treino'}
        </h1>
      </div>

      <div className="space-y-5 px-4 pt-5">
        <div className="space-y-1.5">
          <Label htmlFor="wname">Nome</Label>
          <Input
            id="wname"
            placeholder="Ex: Peito + Tríceps"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Modo</Label>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1">
            <button
              type="button"
              onClick={() => setMode('hypertrophy')}
              className={
                mode === 'hypertrophy'
                  ? 'rounded-md bg-background py-2 text-sm shadow-sm'
                  : 'rounded-md py-2 text-sm text-muted-foreground'
              }
            >
              Hipertrofia
            </button>
            <button
              type="button"
              onClick={() => setMode('strength')}
              className={
                mode === 'strength'
                  ? 'rounded-md bg-background py-2 text-sm shadow-sm'
                  : 'rounded-md py-2 text-sm text-muted-foreground'
              }
            >
              Força
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {mode === 'hypertrophy'
              ? 'Defaults: 4×8–12, descanso 75s'
              : 'Defaults: 5×3–6, descanso 3min'}
          </p>
        </div>

        {!isEdit ? (
          <button
            type="button"
            onClick={() => setTemplatePicker(true)}
            className="flex w-full items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3 text-left text-sm hover:bg-primary/10"
          >
            <Sparkles className="size-4 text-primary" />
            <span>Começar de um template (ABC, Push/Pull/Legs…)</span>
          </button>
        ) : null}

        <div>
          <div className="flex items-center justify-between">
            <Label>Exercícios ({draft.length})</Label>
            <button
              type="button"
              onClick={() => setPicker(true)}
              className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground"
            >
              <Plus className="size-3.5" />
              Adicionar
            </button>
          </div>

          {draft.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhum exercício ainda. Toque "Adicionar".
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {draft.map((d, idx) => {
                const ex = exById.get(d.exerciseId)
                const isCardio = ex?.kind === 'cardio'
                return (
                  <li
                    key={`${d.exerciseId}-${idx}`}
                    className="rounded-xl border border-border bg-card p-3"
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => move(idx, -1)}
                        disabled={idx === 0}
                        className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-accent disabled:opacity-30"
                        aria-label="Mover pra cima"
                      >
                        <GripVertical className="size-4" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {ex?.name ?? d.exerciseId}
                        </p>
                        {ex ? (
                          <p className="text-xs text-muted-foreground">
                            {musclesQ.data?.find(
                              (m) => m.id === ex.primaryMuscleId,
                            )?.namePt}{' '}
                            ·{' '}
                            {EQUIPMENT_LABELS[ex.equipment] ?? ex.equipment}
                            {isCardio ? ' · Cardio' : ''}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExercise(idx)}
                        className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Remover"
                      >
                        <X className="size-4" />
                      </button>
                    </div>

                    {isCardio ? (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <NumberField
                          label="Intervalos"
                          value={d.setsTarget}
                          onChange={(v) =>
                            updateExercise(idx, { setsTarget: v })
                          }
                        />
                        <NumberField
                          label="Duração (min)"
                          value={
                            d.durationSecondsTarget
                              ? Math.round(d.durationSecondsTarget / 60)
                              : 0
                          }
                          onChange={(v) =>
                            updateExercise(idx, {
                              durationSecondsTarget: v > 0 ? v * 60 : null,
                            })
                          }
                        />
                        <NumberField
                          label="Dist. (km)"
                          step={0.1}
                          value={d.distanceKmTarget ?? 0}
                          onChange={(v) =>
                            updateExercise(idx, {
                              distanceKmTarget: v > 0 ? v : null,
                            })
                          }
                        />
                      </div>
                    ) : (
                      <div className="mt-3 grid grid-cols-4 gap-2">
                        <NumberField
                          label="Séries"
                          value={d.setsTarget}
                          onChange={(v) =>
                            updateExercise(idx, { setsTarget: v })
                          }
                        />
                        <NumberField
                          label="Reps min"
                          value={d.repsMin}
                          onChange={(v) =>
                            updateExercise(idx, { repsMin: v })
                          }
                        />
                        <NumberField
                          label="Reps max"
                          value={d.repsMax}
                          onChange={(v) =>
                            updateExercise(idx, { repsMax: v })
                          }
                        />
                        <NumberField
                          label="Descanso s"
                          value={d.restSeconds}
                          onChange={(v) =>
                            updateExercise(idx, { restSeconds: v })
                          }
                        />
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {error ? (
          <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 backdrop-blur safe-bottom">
        <div className="mx-auto flex max-w-2xl items-center gap-2 p-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={save}
            disabled={create.isPending || update.isPending}
            className="flex-1"
          >
            {create.isPending || update.isPending ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </div>

      {picker ? (
        <ExercisePicker
          exercises={exercisesQ.data ?? []}
          muscleGroups={musclesQ.data ?? []}
          onPick={(id) => addExercise(id)}
          onClose={() => setPicker(false)}
        />
      ) : null}

      {templatePicker && templatesQ.data ? (
        <TemplatePicker
          templates={templatesQ.data}
          onPick={applyTemplate}
          onClose={() => setTemplatePicker(false)}
        />
      ) : null}
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
  step,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type="number"
        inputMode={step ? 'decimal' : 'numeric'}
        value={value}
        step={step}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="mt-0.5 h-9 w-full rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums"
      />
    </label>
  )
}

function ExercisePicker({
  exercises,
  muscleGroups,
  onPick,
  onClose,
}: {
  exercises: Exercise[]
  muscleGroups: { id: string; namePt: string }[]
  onPick: (id: string) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const [muscle, setMuscle] = useState<string | null>(null)
  const filtered = useMemo(
    () =>
      exercises.filter(
        (e) =>
          (!muscle || e.primaryMuscleId === muscle) &&
          (!search ||
            e.name.toLowerCase().includes(search.trim().toLowerCase())),
      ),
    [exercises, search, muscle],
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-background/80 backdrop-blur-sm sm:items-center">
      <div className="mx-auto flex h-[85vh] w-full max-w-md flex-col rounded-t-2xl border border-border bg-card sm:rounded-2xl">
        <div className="flex items-center gap-2 border-b border-border p-3">
          <h2 className="flex-1 text-sm font-medium">Adicionar exercício</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-accent"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-2 p-3">
          <Input
            placeholder="Buscar…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ScrollRow className="-mx-3 px-3">
            <Mini active={muscle === null} onClick={() => setMuscle(null)}>
              Todos
            </Mini>
            {muscleGroups.map((m) => (
              <Mini
                key={m.id}
                active={muscle === m.id}
                onClick={() => setMuscle(muscle === m.id ? null : m.id)}
              >
                {m.namePt}
              </Mini>
            ))}
          </ScrollRow>
        </div>

        <ul className="flex-1 space-y-1 overflow-y-auto p-3 pt-0">
          {filtered.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => onPick(e.id)}
                className="flex w-full items-center gap-2 rounded-lg p-2 text-left hover:bg-accent"
              >
                <div
                  className="size-8 shrink-0 rounded-md"
                  style={{
                    backgroundColor:
                      MUSCLE_COLORS[e.primaryMuscleId] ?? '#64748b',
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {muscleGroups.find((m) => m.id === e.primaryMuscleId)
                      ?.namePt}
                  </p>
                </div>
                <Plus className="size-4 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function TemplatePicker({
  templates,
  onPick,
  onClose,
}: {
  templates: import('@/types').WorkoutTemplate[]
  onPick: (id: string) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-background/80 backdrop-blur-sm sm:items-center">
      <div className="mx-auto flex max-h-[85vh] w-full max-w-md flex-col rounded-t-2xl border border-border bg-card sm:rounded-2xl">
        <div className="flex items-center gap-2 border-b border-border p-3">
          <h2 className="flex-1 text-sm font-medium">Templates</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-accent"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>
        <ul className="space-y-2 overflow-y-auto p-3">
          {templates.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onPick(t.id)}
                className="w-full rounded-lg border border-border p-3 text-left hover:bg-accent"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t.name}</span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider',
                      t.mode === 'strength'
                        ? 'bg-primary/15 text-primary'
                        : 'bg-secondary text-secondary-foreground',
                    )}
                  >
                    {t.mode === 'strength' ? 'Força' : 'Hipertrofia'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.description}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.exercises.length} exercícios
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Mini({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'shrink-0 rounded-full border border-primary bg-primary px-3 py-1 text-xs text-primary-foreground'
          : 'shrink-0 rounded-full border border-border px-3 py-1 text-xs hover:bg-accent'
      }
    >
      {children}
    </button>
  )
}
