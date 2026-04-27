import { Link } from 'react-router-dom'
import {
  CalendarDays,
  Check,
  Dumbbell,
  Plus,
  Star,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useWorkouts } from '@/features/workouts/queries'
import { usePlans } from '@/features/plans/queries'
import { cn } from '@/lib/utils'
import {
  estimateWorkoutVolume,
  formatVolume,
  sumVolumes,
} from '@/lib/workout-volume'
import { DAY_LABELS_SHORT, type WorkoutWithExercises } from '@/types'

export function WorkoutsRoute() {
  const workoutsQ = useWorkouts()
  const plansQ = usePlans()

  const activePlan = plansQ.data?.find((p) => p.isActive) ?? null

  return (
    <div className="pb-4">
      <PageHeader
        title="Treinos"
        subtitle="Templates e plano semanal."
        action={
          <Link
            to="/workouts/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm font-medium hover:bg-accent"
          >
            <Plus className="size-4" />
            Novo
          </Link>
        }
      />

      {/* ===== Plano da semana ===== */}
      <section className="px-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Plano da semana
          </h2>
          <Link
            to="/plans"
            className="text-xs text-primary hover:underline"
          >
            ver todos
          </Link>
        </div>

        {plansQ.isLoading ? (
          <div className="mt-2 h-32 animate-pulse rounded-xl bg-card" />
        ) : !activePlan ? (
          <Link
            to="/plans/new"
            className="mt-2 flex items-center gap-3 rounded-xl border border-dashed border-border p-4 text-sm hover:bg-accent"
          >
            <CalendarDays className="size-5 text-muted-foreground" />
            <span className="flex-1">
              Sem plano ativo. Cria um pra organizar a semana.
            </span>
            <Plus className="size-4 text-muted-foreground" />
          </Link>
        ) : (
          <PlanCard
            planName={activePlan.name}
            days={activePlan.days}
            workouts={workoutsQ.data ?? []}
          />
        )}
      </section>

      {/* ===== Treinos salvos ===== */}
      <section className="mt-6 px-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Meus treinos
        </h2>

        {workoutsQ.isLoading ? (
          <div className="mt-2 flex justify-center py-6">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (workoutsQ.data ?? []).length === 0 ? (
          <div className="mt-2 rounded-xl border border-dashed border-border p-8 text-center">
            <Dumbbell className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              Nenhum treino criado ainda.
            </p>
            <Link
              to="/workouts/new"
              className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              <Plus className="size-4" />
              Criar treino
            </Link>
          </div>
        ) : (
          <ul className="mt-2 space-y-2">
            {workoutsQ.data!.map((w) => (
              <WorkoutItem key={w.id} workout={w} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function WorkoutItem({ workout }: { workout: WorkoutWithExercises }) {
  const volume = estimateWorkoutVolume(workout)

  return (
    <li>
      <Link
        to={`/workouts/${workout.id}`}
        className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
      >
        <div
          className={cn(
            'flex size-10 items-center justify-center rounded-lg text-xs font-bold uppercase',
            workout.mode === 'strength'
              ? 'bg-primary/15 text-primary'
              : 'bg-secondary text-secondary-foreground',
          )}
        >
          {workout.mode === 'strength' ? 'FOR' : 'HIP'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{workout.name}</p>
          <p className="text-xs text-muted-foreground">
            {workout.exercises?.length ?? 0} exercícios ·{' '}
            {workout.mode === 'strength' ? 'Força' : 'Hipertrofia'} ·{' '}
            {formatVolume(volume)}
          </p>
        </div>
      </Link>
    </li>
  )
}

function PlanCard({
  planName,
  days,
  workouts,
}: {
  planName: string
  days: import('@/types').PlanDay[]
  workouts: WorkoutWithExercises[]
}) {
  const workoutById = new Map(workouts.map((w) => [w.id, w]))
  const today = new Date().getDay()

  // Reordena pra começar na segunda
  const order = [1, 2, 3, 4, 5, 6, 0]
  const dayMap = new Map(days.map((d) => [d.dayOfWeek, d]))
  const todayDay = dayMap.get(today)
  const todayWorkout = todayDay?.workoutId
    ? workoutById.get(todayDay.workoutId)
    : null

  return (
    <div className="mt-2 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Star className="size-4 fill-primary text-primary" />
        <p className="text-sm font-medium">{planName}</p>
        <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">
          ativo
        </span>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1">
        {order.map((dow) => {
          const d = dayMap.get(dow)
          const w = d?.workoutId ? workoutById.get(d.workoutId) : null
          const isToday = dow === today
          return (
            <div
              key={dow}
              className={cn(
                'flex flex-col items-center gap-1 rounded-md p-1.5',
                isToday && 'bg-primary/10 ring-1 ring-primary/40',
              )}
            >
              <span
                className={cn(
                  'text-[10px] uppercase tracking-wider',
                  isToday ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {DAY_LABELS_SHORT[dow]}
              </span>
              {w ? (
                <div
                  className="flex size-6 items-center justify-center rounded text-[8px] font-bold uppercase text-white"
                  style={{
                    backgroundColor:
                      w.mode === 'strength' ? '#dc2626' : '#475569',
                  }}
                  title={w.name}
                >
                  {w.name.slice(0, 1)}
                </div>
              ) : (
                <div className="flex size-6 items-center justify-center text-muted-foreground">
                  ·
                </div>
              )}
            </div>
          )
        })}
      </div>

      {todayWorkout ? (
        <Link
          to={`/workouts/${todayWorkout.id}`}
          className="mt-3 flex items-center gap-2 rounded-md bg-primary p-2.5 text-sm text-primary-foreground"
        >
          <Check className="size-4" />
          <span className="flex-1 font-medium">Hoje: {todayWorkout.name}</span>
          <span className="text-xs opacity-80">→</span>
        </Link>
      ) : todayDay ? (
        <p className="mt-3 rounded-md bg-secondary p-2.5 text-center text-sm text-muted-foreground">
          Hoje é dia de descanso 😎
        </p>
      ) : null}

      <PlanWeeklyVolume days={days} workouts={workouts} />
    </div>
  )
}

function PlanWeeklyVolume({
  days,
  workouts,
}: {
  days: import('@/types').PlanDay[]
  workouts: WorkoutWithExercises[]
}) {
  const workoutById = new Map(workouts.map((w) => [w.id, w]))
  const used = days
    .map((d) => (d.workoutId ? workoutById.get(d.workoutId) ?? null : null))
    .filter((w): w is WorkoutWithExercises => !!w)

  if (used.length === 0) return null

  const perWorkout = used.map((w) => estimateWorkoutVolume(w))
  const total = sumVolumes(perWorkout)
  const avgKg = used.length > 0 ? total.kg / used.length : 0
  const avgReps = used.length > 0 ? total.reps / used.length : 0

  return (
    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Por treino (média)
        </p>
        <p className="mt-0.5 text-base font-semibold tabular-nums">
          {total.hasKgEstimate
            ? avgKg >= 1000
              ? `${(avgKg / 1000).toFixed(1)}t`
              : `${Math.round(avgKg)}kg`
            : `${Math.round(avgReps)} reps`}
        </p>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Total da semana
        </p>
        <p className="mt-0.5 text-base font-semibold tabular-nums">
          {total.hasKgEstimate
            ? formatVolume(total)
            : `${Math.round(total.reps)} reps`}
        </p>
      </div>
    </div>
  )
}
