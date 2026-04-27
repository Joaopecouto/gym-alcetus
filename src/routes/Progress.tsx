import { useMemo, useState } from 'react'
import { format, startOfDay, startOfMonth, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
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
import {
  MUSCLE_COLORS,
  type Exercise,
  type SessionWithSets,
} from '@/types'

type Mode = 'exercise' | 'muscle'
type Metric = 'oneRm' | 'weight' | 'volume'
type RangePreset = 'today' | 'week' | 'month' | 'all' | 'custom'

const METRIC_OPTIONS: Array<{ value: Metric; label: string }> = [
  { value: 'oneRm', label: '1RM est.' },
  { value: 'weight', label: 'Carga máx' },
  { value: 'volume', label: 'Volume' },
]

const RANGE_PRESETS: Array<{ value: RangePreset; label: string }> = [
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'all', label: 'Tudo' },
  { value: 'custom', label: 'Personalizado' },
]

function rangeFromPreset(
  preset: RangePreset,
  custom: { from: string; to: string },
) {
  const now = new Date()
  switch (preset) {
    case 'today':
      return { from: startOfDay(now).getTime(), to: now.getTime() }
    case 'week':
      return {
        from: startOfWeek(now, { weekStartsOn: 1 }).getTime(),
        to: now.getTime(),
      }
    case 'month':
      return { from: startOfMonth(now).getTime(), to: now.getTime() }
    case 'all':
      return { from: 0, to: now.getTime() }
    case 'custom':
      return {
        from: custom.from
          ? new Date(custom.from).getTime()
          : 0,
        to: custom.to
          ? new Date(custom.to + 'T23:59:59').getTime()
          : now.getTime(),
      }
  }
}

export function ProgressRoute() {
  const sessionsQ = useSessions()
  const exercisesQ = useExercises()
  const musclesQ = useMuscleGroups()

  const [mode, setMode] = useState<Mode>('exercise')
  const [metric, setMetric] = useState<Metric>('oneRm')
  const [preset, setPreset] = useState<RangePreset>('month')
  const [customRange, setCustomRange] = useState({ from: '', to: '' })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const range = rangeFromPreset(preset, customRange)

  const finishedSessions = useMemo(
    () =>
      (sessionsQ.data ?? []).filter(
        (s) =>
          s.finishedAt &&
          s.finishedAt >= range.from &&
          s.finishedAt <= range.to,
      ),
    [sessionsQ.data, range.from, range.to],
  )

  const sessionSetsQ = useQuery({
    queryKey: ['session-sets-all', finishedSessions.map((s) => s.id)],
    enabled: finishedSessions.length > 0,
    queryFn: async () =>
      Promise.all(finishedSessions.map((s) => api.getSession(s.id))),
  })

  // Lista candidatos pro selector — exercícios usados ou todos os músculos
  const exercisesUsed = useMemo(() => {
    const set = new Set<string>()
    for (const s of sessionSetsQ.data ?? []) {
      for (const ss of s.sets.filter((set) => set.completed)) set.add(ss.exerciseId)
    }
    return Array.from(set)
      .map((id) => exercisesQ.data?.find((e) => e.id === id))
      .filter((e): e is Exercise => !!e)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [sessionSetsQ.data, exercisesQ.data])

  // Default selection
  if (mode === 'exercise' && selectedId === null && exercisesUsed.length > 0) {
    setSelectedId(exercisesUsed[0].id)
  }
  if (mode === 'muscle' && selectedId === null && musclesQ.data?.length) {
    setSelectedId(musclesQ.data[0].id)
  }

  const chartData = useMemo(() => {
    if (mode === 'exercise' && selectedId) {
      return buildExerciseSeries(
        sessionSetsQ.data ?? [],
        selectedId,
        metric,
      )
    }
    if (mode === 'muscle' && selectedId) {
      return buildMuscleSeries(
        sessionSetsQ.data ?? [],
        exercisesQ.data ?? [],
        selectedId,
        metric,
      )
    }
    return []
  }, [mode, selectedId, sessionSetsQ.data, exercisesQ.data, metric])

  const muscleVolume = useMemo(
    () =>
      buildMuscleVolume(sessionSetsQ.data ?? [], exercisesQ.data ?? []),
    [sessionSetsQ.data, exercisesQ.data],
  )

  const accentColor =
    mode === 'exercise'
      ? selectedId
        ? MUSCLE_COLORS[
            exercisesQ.data?.find((e) => e.id === selectedId)?.primaryMuscleId ??
              ''
          ] ?? '#dc2626'
        : '#dc2626'
      : selectedId
        ? MUSCLE_COLORS[selectedId] ?? '#dc2626'
        : '#dc2626'

  return (
    <div className="pb-6">
      <PageHeader
        title="Evolução"
        subtitle="Filtre por exercício ou músculo, no período que quiser."
      />

      <div className="space-y-3 px-4 pt-2">
        {/* Toggle modo */}
        <div className="grid grid-cols-2 gap-1 rounded-md bg-secondary p-1">
          <button
            type="button"
            onClick={() => {
              setMode('exercise')
              setSelectedId(null)
            }}
            className={
              mode === 'exercise'
                ? 'rounded-md bg-background py-2 text-sm shadow-sm'
                : 'rounded-md py-2 text-sm text-muted-foreground'
            }
          >
            Por exercício
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('muscle')
              setSelectedId(null)
            }}
            className={
              mode === 'muscle'
                ? 'rounded-md bg-background py-2 text-sm shadow-sm'
                : 'rounded-md py-2 text-sm text-muted-foreground'
            }
          >
            Por músculo
          </button>
        </div>

        {/* Filtro temporal */}
        <div className="-mx-4 overflow-x-auto px-4 [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-1.5">
            {RANGE_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPreset(p.value)}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1 text-xs transition-colors',
                  preset === p.value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:bg-accent',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {preset === 'custom' ? (
          <div className="flex items-center gap-2 rounded-md border border-border bg-card p-2">
            <input
              type="date"
              value={customRange.from}
              onChange={(e) =>
                setCustomRange((c) => ({ ...c, from: e.target.value }))
              }
              className="h-9 flex-1 rounded-md bg-background px-2 text-sm"
            />
            <span className="text-muted-foreground">→</span>
            <input
              type="date"
              value={customRange.to}
              onChange={(e) =>
                setCustomRange((c) => ({ ...c, to: e.target.value }))
              }
              className="h-9 flex-1 rounded-md bg-background px-2 text-sm"
            />
          </div>
        ) : null}

        <div className="rounded-xl border border-border bg-card p-4">
          {mode === 'exercise' && exercisesUsed.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
              <TrendingUp className="size-8" />
              <p>Treine pra ver gráficos aqui.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  value={selectedId ?? ''}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm"
                >
                  {mode === 'exercise'
                    ? exercisesUsed.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))
                    : musclesQ.data?.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.namePt}
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
                    Sem dados pro filtro selecionado.
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
                        stroke={accentColor}
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
          Volume por grupo muscular (período)
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

function buildExerciseSeries(
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
      dateLabel: format(new Date(s.startedAt), 'd/MM', { locale: ptBR }),
      value: Math.round(value * 10) / 10,
    })
  }
  return points.sort((a, b) => a.date - b.date)
}

function buildMuscleSeries(
  sessions: SessionWithSets[],
  exercises: Exercise[],
  muscleId: string,
  metric: Metric,
): ChartPoint[] {
  const exMuscle = new Map(exercises.map((e) => [e.id, e.primaryMuscleId]))
  const points: ChartPoint[] = []
  for (const s of sessions) {
    const sets = s.sets.filter(
      (set) =>
        set.completed && exMuscle.get(set.exerciseId) === muscleId,
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
      dateLabel: format(new Date(s.startedAt), 'd/MM', { locale: ptBR }),
      value: Math.round(value * 10) / 10,
    })
  }
  return points.sort((a, b) => a.date - b.date)
}

function buildMuscleVolume(
  sessions: SessionWithSets[],
  exercises: Exercise[],
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
