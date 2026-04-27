import { Link } from 'react-router-dom'
import { Dumbbell, Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useWorkouts } from '@/features/workouts/queries'
import { cn } from '@/lib/utils'

export function WorkoutsRoute() {
  const workoutsQ = useWorkouts()

  return (
    <div className="pb-4">
      <PageHeader
        title="Treinos"
        subtitle="Seus templates reutilizáveis."
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

      <div className="px-4 pt-2">
        {workoutsQ.isLoading ? (
          <div className="flex justify-center py-8">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (workoutsQ.data ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
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
          <ul className="space-y-2">
            {workoutsQ.data!.map((w) => (
              <li key={w.id}>
                <Link
                  to={`/workouts/${w.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
                >
                  <div
                    className={cn(
                      'flex size-10 items-center justify-center rounded-lg text-xs font-bold uppercase',
                      w.mode === 'strength'
                        ? 'bg-primary/15 text-primary'
                        : 'bg-secondary text-secondary-foreground',
                    )}
                  >
                    {w.mode === 'strength' ? 'FOR' : 'HIP'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{w.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {w.exercises?.length ?? 0} exercícios ·{' '}
                      {w.mode === 'strength' ? 'Força' : 'Hipertrofia'}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
