import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Dumbbell, Flame, Play, Settings as SettingsIcon } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PageHeader } from '@/components/layout/PageHeader'
import { useSessions } from '@/features/sessions/queries'
import { useWorkouts } from '@/features/workouts/queries'
import { useUser } from '@/stores/user'

export function HomeRoute() {
  const user = useUser((s) => s.user)
  const sessionsQ = useSessions()
  const workoutsQ = useWorkouts()

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

  const greeting = useMemo(() => greetingFor(user?.name ?? 'você'), [user])

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
            className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
            aria-label="Configurações"
          >
            <SettingsIcon className="size-5" />
          </Link>
        }
      />

      <section className="space-y-3 px-4 pt-4">
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
        ) : (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Você ainda não treinou. Crie um treino e comece!
            </p>
            <Link
              to="/workouts/new"
              className="mt-3 inline-flex h-9 items-center gap-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
            >
              Criar primeiro treino
            </Link>
          </div>
        )}
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
