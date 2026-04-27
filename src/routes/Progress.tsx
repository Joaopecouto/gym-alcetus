import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useSessions } from '@/features/sessions/queries'
import {
  useExercises,
  useMuscleGroups,
} from '@/features/exercises/queries'
import { api } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { estimate1RM } from '@/lib/calc-1rm'
import { cn } from '@/lib/utils'
import { MUSCLE_COLORS, type SessionWithSets } from '@/types'

type Metric = 'weight' | 'oneRm' | 'volume'

const METRIC_OPTIONS: Array<{ value: Metric; label: string }> = [
  { value: 'oneRm', label: '1RM est.' },
  { value: 'weight', label: 'Carga máx' },
  { value: 'volume', label: 'Volume' },
]

export function ProgressRoute() {
  const sessionsQ = useSessions()
  const exercisesQ = useExercises()
  const musclesQ = useMuscleGroups()

  const finishedSessions = useMemo(
    () => (sessionsQ.data ?? []).filter((s) => s.finishedAt),
    [sessionsQ.data],
  )

  // Carrega séries de cada sessão sob demanda
  const sessionSetsQ = useQuery({
    queryKey: ['session-sets-all', finishedSessions.map((s) => s.id)],
    enabled: finishedSessions.length > 0,
    queryFn: async () => {
      const all = await Promise.all(
        finishedSessions.map((s) => api.getSession(s.id)),
      )
      return all
    },
  })

  // Lista de exercícios que aparecem no histórico
  const exercisesUsed = useMemo(() => {
    const set = new Set<string>()
    for (const s of sessionSetsQ.data ?? []) {
      for (const ss of s.sets) set.add(ss.exerciseId)
    }
    return Array.from(set)
      .map((id) => exercisesQ.data?.find((e) => e.id === id))
      .filter((e): e is NonNullable<typeof e> => !!e)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [sessionSetsQ.data, exercisesQ.data])

  const [selectedExId, setSelectedExId] = useState<string | null>(null)
  const [metric, setMetric] = useState<Metric>('oneRm')

  // Quando carrega lista, seleciona primeiro
  if (selectedExId === null && exercisesUsed.length > 0) {
    setSelectedExId(exercisesUsed[0].id)
  }

  const chartData = useMemo(() => {
    if (!selectedExId) return []
    return buildSeries(sessionSetsQ.data ?? [], selectedExId, metric)
  }, [sessionSetsQ.data, selectedExId, metric])

  const muscleVolume = useMemo(
    () => buildMuscleVolume(sessionSetsQ.data ?? [], exercisesQ.data ?? []),
    [sessionSetsQ.data, exercisesQ.data],
  )

  const selectedExercise = exercisesQ.data?.find((e) => e.id === selectedExId)
  const selectedColor = selectedExercise
    ? MUSCLE_COLORS[selectedExercise.primaryMuscleId] ?? '#dc2626'
    : '#dc2626'

  return (
    <div className="pb-6">
      <PageHeader
        title="Evolução"
        subtitle="Carga, 1RM estimado e volume por grupo muscular."
      />

      <div className="px-4 pt-2">
        <div className="rounded-xl border border-border bg-card p-4">
          {exercisesUsed.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
              <TrendingUp className="size-8" />
              <p>Treine pra ver gráficos aqui.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  value={selectedExId ?? ''}
                  onChange={(e) => setSelectedExId(e.target.value)}
                  className="h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm"
                >
                  {exercisesUsed.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-3 gap-1 rounded-md bg-secondary p-1">
                  {METRIC_OPTIONS.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setMetric(m.value)}
                      className={cn(
                        'rounded px-2 py-1 text-xs',
                        metric === m.value
                          ? 'bg-background shadow-sm'
                          : 'text-muted-foreground',
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 h-56 w-full">
                {chartData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Sem dados pra esse exercício.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 5, right: 8, bottom: 0, left: -10 }}
                    >
                      <CartesianGrid
                        stroke="var(--color-border)"
                        strokeDasharray="3 3"
                      />
                      <XAxis
                        dataKey="dateLabel"
                        stroke="var(--color-muted-foreground)"
                        fontSize={11}
                      />
                      <YAxis
                        stroke="var(--color-muted-foreground)"
                        fontSize={11}
                        width={40}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--color-card)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={selectedColor}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <section className="mt-6 px-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Volume por grupo muscular
        </h2>
        {muscleVolume.length === 0 ? (
          <p className="mt-2 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Sem dados ainda.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {muscleVolume.map((row) => {
              const muscle = musclesQ.data?.find((m) => m.id === row.muscleId)
              const color = MUSCLE_COLORS[row.muscleId] ?? '#64748b'
              return (
                <li
                  key={row.muscleId}
                  className="rounded-lg bg-card p-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {muscle?.namePt ?? row.muscleId}
                    </span>
                    <span className="tabular-nums">
                      {Math.round(row.volume)}kg
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${row.pct * 100}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

interface ChartPoint {
  date: number
  dateLabel: string
  value: number
}

function buildSeries(
  sessions: SessionWithSets[],
  exerciseId: string,
  metric: Metric,
): ChartPoint[] {
  const points: ChartPoint[] = []
  for (const s of sessions) {
    const sets = s.sets.filter(
      (set) => set.exerciseId === exerciseId && set.completed,
    )
    if (sets.length === 0) continue
    let value = 0
    if (metric === 'weight') {
      value = Math.max(...sets.map((set) => set.weightKg))
    } else if (metric === 'oneRm') {
      value = Math.max(
        ...sets.map((set) => estimate1RM(set.weightKg, set.reps)),
      )
    } else {
      value = sets.reduce((acc, set) => acc + set.weightKg * set.reps, 0)
    }
    points.push({
      date: s.startedAt,
      dateLabel: format(new Date(s.startedAt), 'd/MM'),
      value: Math.round(value * 10) / 10,
    })
  }
  return points.sort((a, b) => a.date - b.date)
}

function buildMuscleVolume(
  sessions: SessionWithSets[],
  exercises: { id: string; primaryMuscleId: string }[],
) {
  const exMuscle = new Map(exercises.map((e) => [e.id, e.primaryMuscleId]))
  const totals = new Map<string, number>()
  for (const s of sessions) {
    for (const set of s.sets) {
      if (!set.completed) continue
      const muscleId = exMuscle.get(set.exerciseId)
      if (!muscleId) continue
      const v = set.weightKg * set.reps
      totals.set(muscleId, (totals.get(muscleId) ?? 0) + v)
    }
  }
  const total = [...totals.values()].reduce((a, b) => a + b, 0)
  return [...totals.entries()]
    .map(([muscleId, volume]) => ({
      muscleId,
      volume,
      pct: total > 0 ? volume / total : 0,
    }))
    .sort((a, b) => b.volume - a.volume)
}
