import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Dialog } from '@/components/ui/Dialog'
import {
  useCreatePlan,
  useDeletePlan,
  usePlan,
  useUpdatePlan,
} from '@/features/plans/queries'
import { useWorkouts } from '@/features/workouts/queries'
import {
  estimateWorkoutVolume,
  formatVolume,
  sumVolumes,
} from '@/lib/workout-volume'
import { DAY_LABELS_FULL, type PlanInput, type WorkoutWithExercises } from '@/types'
import { cn } from '@/lib/utils'

const DAYS_ORDERED = [1, 2, 3, 4, 5, 6, 0] // segunda → domingo

export function PlanEditorRoute() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const existing = usePlan(id)
  const workoutsQ = useWorkouts()
  const create = useCreatePlan()
  const update = useUpdatePlan()
  const del = useDeletePlan()

  const [name, setName] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [days, setDays] = useState<Record<number, string | null>>({
    0: null,
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
  })
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (existing.data) {
      setName(existing.data.name)
      setIsActive(existing.data.isActive)
      const map: Record<number, string | null> = {
        0: null,
        1: null,
        2: null,
        3: null,
        4: null,
        5: null,
        6: null,
      }
      for (const d of existing.data.days) {
        map[d.dayOfWeek] = d.workoutId
      }
      setDays(map)
    }
  }, [existing.data])

  const workoutById = new Map(workoutsQ.data?.map((w) => [w.id, w]))
  const used = Object.values(days)
    .map((wid) => (wid ? workoutById.get(wid) ?? null : null))
    .filter((w): w is WorkoutWithExercises => !!w)
  const total = sumVolumes(used.map((w) => estimateWorkoutVolume(w)))
  const restDays = 7 - used.length

  async function save() {
    if (!name.trim()) {
      setError('Dá um nome pro plano.')
      return
    }
    setError(null)
    const payload: PlanInput = {
      name: name.trim(),
      isActive,
      days: Object.entries(days).map(([dow, wid]) => ({
        dayOfWeek: Number(dow),
        workoutId: wid,
      })),
    }
    try {
      if (isEdit && id) {
        await update.mutateAsync({ id, payload })
        navigate('/plans')
      } else {
        await create.mutateAsync(payload)
        navigate('/plans')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao salvar.')
    }
  }

  async function doDelete() {
    if (!id) return
    try {
      await del.mutateAsync(id)
      setConfirmDelete(false)
      navigate('/plans')
    } catch (e) {
      console.error('Falha ao apagar plano:', e)
      const { describeError } = await import('@/lib/api')
      alert('Não consegui apagar:\n\n' + describeError(e))
    }
  }

  return (
    <div className="pb-32">
      <div className="flex items-center gap-2 px-2 pt-3">
        <Link
          to="/plans"
          className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="flex-1 text-lg font-semibold">
          {isEdit ? 'Editar plano' : 'Novo plano'}
        </h1>
        {isEdit ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="Apagar plano"
          >
            <Trash2 className="size-4" />
          </button>
        ) : null}
      </div>

      <div className="space-y-5 px-4 pt-5">
        <div className="space-y-1.5">
          <Label htmlFor="pname">Nome</Label>
          <Input
            id="pname"
            placeholder="Ex: Bulking ABC"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="size-4 accent-[var(--color-primary)]"
          />
          <span className="text-sm">Ativar este plano (desativa os outros)</span>
        </label>

        <div>
          <Label>Treino de cada dia</Label>
          <div className="mt-2 space-y-1.5">
            {DAYS_ORDERED.map((dow) => {
              const w = days[dow] ? workoutById.get(days[dow]!) : null
              return (
                <div
                  key={dow}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5"
                >
                  <span className="w-20 text-sm font-medium tabular-nums">
                    {DAY_LABELS_FULL[dow]}
                  </span>
                  <select
                    value={days[dow] ?? ''}
                    onChange={(e) =>
                      setDays((d) => ({
                        ...d,
                        [dow]: e.target.value || null,
                      }))
                    }
                    className="h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value="">— descanso —</option>
                    {workoutsQ.data?.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                  {w ? (
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider',
                        w.mode === 'strength'
                          ? 'bg-primary/15 text-primary'
                          : 'bg-secondary text-secondary-foreground',
                      )}
                    >
                      {w.mode === 'strength' ? 'Força' : 'Hipert.'}
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>

        {/* Resumo de volume da semana */}
        {used.length > 0 ? (
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Resumo da semana
            </h3>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <Stat
                label="Treinos"
                value={`${used.length}× / sem`}
                hint={`${restDays} dia${restDays === 1 ? '' : 's'} de descanso`}
              />
              <Stat
                label="Por treino (média)"
                value={
                  total.hasKgEstimate
                    ? `${Math.round(total.kg / used.length)} kg`
                    : `${Math.round(total.reps / used.length)} reps`
                }
              />
              <Stat
                label="Total semanal"
                value={
                  total.hasKgEstimate
                    ? formatVolume(total)
                    : `${Math.round(total.reps)} reps`
                }
                hint={
                  total.hasKgEstimate
                    ? undefined
                    : 'defina peso alvo nos exerc. pra ver kg'
                }
              />
            </div>
          </div>
        ) : null}

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
            {create.isPending || update.isPending ? 'Salvando…' : 'Salvar plano'}
          </Button>
        </div>
      </div>

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Apagar "${name}"?`}
        description="Os treinos associados continuam — só o planejamento é removido."
        actions={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={doDelete}>
              Apagar
            </Button>
          </>
        }
      />
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
      {hint ? (
        <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
