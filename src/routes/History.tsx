import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, Clock, Dumbbell, Flame, Target, Weight } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useSessions } from '@/features/sessions/queries'
import { useWorkouts } from '@/features/workouts/queries'
import { useExercises, useMuscleGroups } from '@/features/exercises/queries'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query'
import { cn } from '@/lib/utils'
import { MUSCLE_COLORS, type Session, type SessionWithSets } from '@/types'

type RangeKey = 'today' | 'week' | 'month' | 'year' | 'all'

const RANGES: Array<{ key: RangeKey; label: string }> = [
  { key: 'today', label: 'Hoje' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mês' },
  { key: 'year', label: 'Ano' },
  { key: 'all', label: 'Tudo' },
]

function rangeBounds(key: RangeKey, now = new Date()) {
  switch (key) {
    case 'today':
      return [startOfDay(now), endOfDay(now)] as const
    case 'week':
      return [
        startOfWeek(now, { weekStartsOn: 1 }),
        endOfWeek(now, { weekStartsOn: 1 }),
      ] as const
    case 'month':
      return [startOfMonth(now), endOfMonth(now)] as const
    case 'year':
      return [startOfYear(now), endOfYear(now)] as const
    case 'all':
      return [new Date(0), new Date(8.64e15)] as const
  }
}

export function HistoryRoute() {
  const sessionsQ = useSessions()
  const workoutsQ = useWorkouts()
  const exercisesQ = useExercises()
  const musclesQ = useMuscleGroups()
  const [range, setRange] = useState<RangeKey>('week')

  const filtered = useMemo(() => {
    const [from, to] = rangeBounds(range)
    return (sessionsQ.data ?? []).filter((s) => {
      if (!s.finishedAt) return false
      return s.finishedAt >= from.getTime() && s.finishedAt <= to.getTime()
    })
  }, [sessionsQ.data, range])

  // Carrega séries de cada sessão filtrada (pra calcular músculo top)
  const setsResults = useQueries({
    queries: filtered.map((s) => ({
      queryKey: queryKeys.session(s.id),
      queryFn: () => api.getSession(s.id),
      staleTime: 60_000,
    })),
  })
  const sessionsWithSets = setsResults
    .map((r) => r.data)
    .filter((s): s is SessionWithSets => !!s)

  const topMuscle = useMemo(
    () =>
      computeTopMuscle(sessionsWithSets, exercisesQ.data ?? []),
    [sessionsWithSets, exercisesQ.data],
  )

  const stats = useMemo(() => computeStats(filtered), [filtered])
  const workoutById = useMemo(
    () => new Map(workoutsQ.data?.map((w) => [w.id, w])),
    [workoutsQ.data],
  )

  return (
    <div className="pb-4">
      <PageHeader
        title="Histórico"
        subtitle="Seus treinos finalizados, com filtros."
      />

      <div className="px-4 pt-2">
        <div className="-mx-4 overflow-x-auto px-4 [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-1.5">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1 text-xs transition-colors',
                  range === r.key
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:bg-accent',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 px-4 sm:grid-cols-4">
        <Stat
          icon={Dumbbell}
          label="Treinos"
          value={stats.count.toString()}
        />
        <Stat
          icon={Weight}
          label="Volume"
          value={`${(stats.volume / 1000).toFixed(1)}t`}
          hint="toneladas"
        />
        <Stat
          icon={Clock}
          label="Tempo"
          value={fmtDuration(stats.durationSec)}
        />
        <Stat
          icon={Flame}
          label="Streak"
          value={`${stats.streak}d`}
        />
      </div>

      {topMuscle ? (
        <div className="mt-3 px-4">
          <div
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            style={{
              borderLeftWidth: 4,
              borderLeftColor:
                MUSCLE_COLORS[topMuscle.muscleId] ?? '#64748b',
            }}
          >
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white"
              style={{
                backgroundColor:
                  MUSCLE_COLORS[topMuscle.muscleId] ?? '#64748b',
              }}
            >
              <Target className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Músculo mais treinado
              </p>
              <p className="font-medium">
                {musclesQ.data?.find((m) => m.id === topMuscle.muscleId)
                  ?.namePt ?? topMuscle.muscleId}
              </p>
            </div>
            <div className="text-right">
              <p className="text-base font-semibold tabular-nums">
                {topMuscle.sets} séries
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {Math.round(topMuscle.volumeKg)}kg
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-6 px-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Sessões
        </h2>
        {sessionsQ.isLoading ? (
          <div className="flex justify-center py-6">
            <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="mt-2 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum treino no período.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {filtered.map((s) => {
              const w = workoutById.get(s.workoutId)
              const date = new Date(s.startedAt)
              return (
                <li key={s.id}>
                  <Link
                    to={`/history/${s.id}`}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                  >
                    <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-md bg-secondary">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {format(date, 'MMM', { locale: ptBR })}
                      </span>
                      <span className="text-sm font-bold leading-none">
                        {format(date, 'd')}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {w?.name ?? 'Treino removido'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(date, 'EEE HH:mm', { locale: ptBR })} ·{' '}
                        {fmtDuration(s.durationSeconds ?? 0)} ·{' '}
                        {Math.round(s.totalVolumeKg ?? 0)}kg
                      </p>
                    </div>
                    <CalendarDays className="size-4 text-muted-foreground" />
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

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        <span>{label}</span>
      </div>
      <p className="mt-1 text-2xl font-semibold leading-tight tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="text-[10px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h${m.toString().padStart(2, '0')}`
  return `${m}min`
}

function computeStats(sessions: Session[]) {
  const count = sessions.length
  const volume = sessions.reduce((acc, s) => acc + (s.totalVolumeKg ?? 0), 0)
  const durationSec = sessions.reduce(
    (acc, s) => acc + (s.durationSeconds ?? 0),
    0,
  )
  const streak = computeStreak(sessions)
  return { count, volume, durationSec, streak }
}

function computeTopMuscle(
  sessions: SessionWithSets[],
  exercises: { id: string; primaryMuscleId: string }[],
): { muscleId: string; sets: number; volumeKg: number } | null {
  const exMuscle = new Map(exercises.map((e) => [e.id, e.primaryMuscleId]))
  const counts = new Map<string, { sets: number; volumeKg: number }>()
  for (const s of sessions) {
    for (const set of s.sets) {
      if (!set.completed) continue
      const muscleId = exMuscle.get(set.exerciseId)
      if (!muscleId) continue
      const cur = counts.get(muscleId) ?? { sets: 0, volumeKg: 0 }
      cur.sets += 1
      cur.volumeKg += set.weightKg * set.reps
      counts.set(muscleId, cur)
    }
  }
  if (counts.size === 0) return null
  let topMuscleId = ''
  let topSets = -1
  for (const [muscleId, c] of counts) {
    if (c.sets > topSets) {
      topSets = c.sets
      topMuscleId = muscleId
    }
  }
  const top = counts.get(topMuscleId)!
  return { muscleId: topMuscleId, sets: top.sets, volumeKg: top.volumeKg }
}

function computeStreak(sessions: Session[]): number {
  if (sessions.length === 0) return 0
  const days = new Set(
    sessions
      .filter((s) => s.finishedAt)
      .map((s) => format(new Date(s.finishedAt!), 'yyyy-MM-dd')),
  )
  let streak = 0
  const cursor = new Date()
  // Permite gap de até 1 dia (ex: hoje sem treino, ontem com)
  while (true) {
    const key = format(cursor, 'yyyy-MM-dd')
    if (days.has(key)) {
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
    } else if (streak === 0) {
      cursor.setDate(cursor.getDate() - 1)
      // tolerância de hoje
      const k2 = format(cursor, 'yyyy-MM-dd')
      if (days.has(k2)) {
        streak += 1
        cursor.setDate(cursor.getDate() - 1)
      } else {
        break
      }
    } else {
      break
    }
  }
  return streak
}
