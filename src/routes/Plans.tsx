import { Link } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Plus, Star } from 'lucide-react'
import { useActivatePlan, usePlans } from '@/features/plans/queries'
import { useWorkouts } from '@/features/workouts/queries'
import { cn } from '@/lib/utils'
import {
  estimateWorkoutVolume,
  formatVolume,
  sumVolumes,
} from '@/lib/workout-volume'
import { DAY_LABELS_SHORT, type WorkoutWithExercises } from '@/types'

export function PlansRoute() {
  const plansQ = usePlans()
  const workoutsQ = useWorkouts()
  const activate = useActivatePlan()

  const workoutById = new Map(workoutsQ.data?.map((w) => [w.id, w]))

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 px-2 pt-3">
        <Link
          to="/workouts"
          className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="flex-1 text-lg font-semibold">Planos semanais</h1>
        <Link
          to="/plans/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm font-medium hover:bg-accent"
        >
          <Plus className="size-4" />
          Novo
        </Link>
      </div>

      <div className="px-4 pt-4">
        {plansQ.isLoading ? (
          <div className="flex justify-center py-6">
            <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (plansQ.data ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <CalendarDays className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              Nenhum plano ainda. Crie um pra organizar a semana.
            </p>
            <Link
              to="/plans/new"
              className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              <Plus className="size-4" />
              Criar plano
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {plansQ.data!.map((p) => {
              const used = p.days
                .map((d) =>
                  d.workoutId ? workoutById.get(d.workoutId) ?? null : null,
                )
                .filter((w): w is WorkoutWithExercises => !!w)
              const total = sumVolumes(used.map((w) => estimateWorkoutVolume(w)))
              return (
                <li key={p.id}>
                  <Link
                    to={`/plans/${p.id}`}
                    className={cn(
                      'block rounded-xl border bg-card p-4',
                      p.isActive ? 'border-primary' : 'border-border',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {p.isActive ? (
                        <Star className="size-4 fill-primary text-primary" />
                      ) : (
                        <Star className="size-4 text-muted-foreground" />
                      )}
                      <p className="font-medium">{p.name}</p>
                      {p.isActive ? (
                        <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">
                          ativo
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            activate.mutate(p.id)
                          }}
                          className="ml-auto rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider hover:bg-accent"
                        >
                          ativar
                        </button>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-7 gap-1">
                      {[1, 2, 3, 4, 5, 6, 0].map((dow) => {
                        const d = p.days.find((x) => x.dayOfWeek === dow)
                        const w = d?.workoutId
                          ? workoutById.get(d.workoutId)
                          : null
                        return (
                          <div
                            key={dow}
                            className="flex flex-col items-center gap-1 rounded-md p-1"
                          >
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              {DAY_LABELS_SHORT[dow]}
                            </span>
                            <div
                              className={cn(
                                'flex size-6 items-center justify-center rounded text-[8px] font-bold uppercase',
                                w
                                  ? 'text-white'
                                  : 'text-muted-foreground',
                              )}
                              style={{
                                backgroundColor: w
                                  ? w.mode === 'strength'
                                    ? '#dc2626'
                                    : '#475569'
                                  : 'transparent',
                              }}
                            >
                              {w ? w.name.slice(0, 1) : '·'}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <p className="mt-3 text-xs text-muted-foreground">
                      {used.length} treinos/sem ·{' '}
                      {total.hasKgEstimate
                        ? formatVolume(total)
                        : `${Math.round(total.reps)} reps`}
                    </p>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
