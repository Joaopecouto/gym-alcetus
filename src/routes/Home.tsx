import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  Dumbbell,
  Flame,
  Play,
} from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PageHeader } from '@/components/layout/PageHeader'
import { useSessions } from '@/features/sessions/queries'
import { useWorkouts } from '@/features/workouts/queries'
import { useActivePlan } from '@/features/plans/queries'
import { useUser } from '@/stores/user'
import { api } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query'
import { cn } from '@/lib/utils'
import { DAY_LABELS_SHORT } from '@/types'

export function HomeRoute() {
  const user = useUser((s) => s.user)
  const sessionsQ = useSessions()
  const workoutsQ = useWorkouts()
  const activePlanQ = useActivePlan()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const stats = useMemo(() => {
    const finished = (sessionsQ.data ?? []).filter((s) => s.finishedAt)
    const last = finished[0]
    const days = new Set(
      finished
        .filter((s) => s.finishedAt)
        .map((s) => format(new Date(s.finishedAt!), 'yyyy-MM-dd')),
    )
    let streak = 0
    const cursor = new Date()
    let checkedToday = false
    while (true) {
      const key = format(cursor, 'yyyy-MM-dd')
      if (days.has(key)) {
        streak += 1
        cursor.setDate(cursor.getDate() - 1)
      } else if (!checkedToday) {
        checkedToday = true
        cursor.setDate(cursor.getDate() - 1)
      } else break
    }
    return { last, streak, total: finished.length }
  }, [sessionsQ.data])

  const todayWorkout = useMemo(() => {
    if (!activePlanQ.data) return null
    const today = new Date().getDay()
    const day = activePlanQ.data.days.find((d) => d.dayOfWeek === today)
    if (!day || !day.workoutId) return null
    return workoutsQ.data?.find((w) => w.id === day.workoutId) ?? null
  }, [activePlanQ.data, workoutsQ.data])

  async function startToday() {
    if (!todayWorkout) return
    const sessionId = await api.startSession(
      todayWorkout.id,
      activePlanQ.data?.id,
    )
    qc.invalidateQueries({ queryKey: queryKeys.sessions })
    navigate(`/session/${sessionId}`)
  }

  const greeting = useMemo(() => greetingFor(user?.name ?? 'você'), [user])

  // Mapa rápido de workouts pra montar o cronograma da semana
  const workoutById = useMemo(
    () => new Map(workoutsQ.data?.map((w) => [w.id, w])),
    [workoutsQ.data],
  )
  const todayDow = new Date().getDay()

  return (
    <div className="pb-4">
      <PageHeader
        title={greeting}
        subtitle={
          stats.total === 0
            ? 'Pronto pra começar?'
            : `${stats.total} ${stats.total === 1 ? 'treino' : 'treinos'} no total.`
        }
        action={
          <Link
            to="/settings"
            className="inline-flex size-9 items-center justify-center overflow-hidden rounded-full bg-secondary text-muted-foreground hover:opacity-90"
            aria-label="Perfil e configurações"
          >
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name ?? 'Perfil'}
                className="size-9 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-sm font-semibold uppercase">
                {(user?.name ?? '?').trim().charAt(0)}
              </span>
            )}
          </Link>
        }
      />

      <section className="space-y-3 px-4 pt-4">
        {todayWorkout ? (
          <button
            type="button"
            onClick={startToday}
            className="flex w-full items-center gap-3 rounded-xl bg-primary p-5 text-left text-primary-foreground shadow-sm"
          >
            <div className="flex size-11 items-center justify-center rounded-full bg-primary-foreground/15">
              <Play className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wider opacity-80">
                Treino de hoje
              </p>
              <p className="truncate text-base font-semibold">
                {todayWorkout.name}
              </p>
              <p className="text-sm opacity-90">
                {todayWorkout.exercises.length} exercícios ·{' '}
                {todayWorkout.mode === 'strength' ? 'Força' : 'Hipertrofia'}
              </p>
            </div>
          </button>
        ) : activePlanQ.data ? (
          <div className="rounded-xl border border-dashed border-border p-5 text-center">
            <p className="text-sm">😎 Hoje é dia de descanso</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Plano ativo: {activePlanQ.data.name}
            </p>
          </div>
        ) : (
          <Link
            to="/workouts"
            className="flex items-center gap-3 rounded-xl bg-primary p-5 text-left text-primary-foreground shadow-sm"
          >
            <div className="flex size-11 items-center justify-center rounded-full bg-primary-foreground/15">
              <Play className="size-5" />
            </div>
            <div>
              <p className="text-base font-semibold">Iniciar treino</p>
              <p className="text-sm opacity-90">
                {(workoutsQ.data?.length ?? 0) === 0
                  ? 'Crie um treino pra começar'
                  : 'Escolha um dos seus treinos salvos'}
              </p>
            </div>
          </Link>
        )}

        {/* Cronograma da semana — atalho rápido pros treinos planejados.
            Só renderiza se houver plano ativo (senão mostra o CTA de criar
            plano mais embaixo). Hoje fica destacado com border primary. */}
        {activePlanQ.data ? (
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Esta semana · {activePlanQ.data.name}
              </p>
              <Link
                to={`/plans/${activePlanQ.data.id}`}
                className="text-xs text-primary hover:underline"
              >
                Editar
              </Link>
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1">
              {[1, 2, 3, 4, 5, 6, 0].map((dow) => {
                const d = activePlanQ.data!.days.find(
                  (x) => x.dayOfWeek === dow,
                )
                const w = d?.workoutId ? workoutById.get(d.workoutId) : null
                const isCurrent = dow === todayDow
                return (
                  <Link
                    key={dow}
                    to={
                      w
                        ? `/workouts/${w.id}`
                        : `/plans/${activePlanQ.data!.id}`
                    }
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-lg border p-1.5 text-center transition',
                      isCurrent
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-accent',
                    )}
                  >
                    <span
                      className={cn(
                        'text-[10px] font-semibold uppercase tracking-wider',
                        isCurrent ? 'text-primary' : 'text-muted-foreground',
                      )}
                    >
                      {DAY_LABELS_SHORT[dow]}
                    </span>
                    <span
                      className={cn(
                        'block w-full truncate text-[11px] font-medium leading-tight',
                        !w && 'text-muted-foreground',
                      )}
                    >
                      {w ? w.name : '—'}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Flame className="size-4 text-primary" />
              <span>Sequência</span>
            </div>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {stats.streak}{' '}
              <span className="text-base font-normal text-muted-foreground">
                {stats.streak === 1 ? 'dia' : 'dias'}
              </span>
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Dumbbell className="size-4 text-primary" />
              <span>Treinos</span>
            </div>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {stats.total}
            </p>
          </div>
        </div>

        {!activePlanQ.data && (workoutsQ.data?.length ?? 0) > 0 ? (
          <Link
            to="/plans/new"
            className="flex items-center gap-3 rounded-xl border border-dashed border-border p-3 text-sm hover:bg-accent"
          >
            <CalendarDays className="size-5 text-muted-foreground" />
            <span className="flex-1">Crie um plano semanal</span>
          </Link>
        ) : null}

        {stats.last ? (
          <Link
            to={`/history/${stats.last.id}`}
            className="block rounded-xl border border-border bg-card p-4"
          >
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Último treino
            </p>
            <p className="mt-1 font-medium">
              {workoutsQ.data?.find((w) => w.id === stats.last!.workoutId)
                ?.name ?? 'Treino'}
            </p>
            <p className="text-xs text-muted-foreground">
              {fmtRelative(stats.last.finishedAt!)} ·{' '}
              {Math.round(stats.last.totalVolumeKg ?? 0)}kg de volume
            </p>
          </Link>
        ) : null}
      </section>
    </div>
  )
}

function greetingFor(name: string): string {
  const hour = new Date().getHours()
  const period =
    hour < 5
      ? 'Madrugada'
      : hour < 12
        ? 'Bom dia'
        : hour < 18
          ? 'Boa tarde'
          : 'Boa noite'
  return `${period}, ${name.split(' ')[0]} 💪`
}

function fmtRelative(ts: number): string {
  const d = new Date(ts)
  if (isToday(d)) return `Hoje, ${format(d, 'HH:mm')}`
  if (isYesterday(d)) return `Ontem, ${format(d, 'HH:mm')}`
  return format(d, "EEE d 'de' MMM", { locale: ptBR })
}
