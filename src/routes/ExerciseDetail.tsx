import { ArrowLeft, Heart, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import {
  useDeleteExercise,
  useExercises,
  useMuscleGroups,
  useToggleFavorite,
} from '@/features/exercises/queries'
import { cn } from '@/lib/utils'
import { EQUIPMENT_LABELS, MUSCLE_COLORS } from '@/types'

export function ExerciseDetailRoute() {
  const { id } = useParams()
  const navigate = useNavigate()
  const exercises = useExercises()
  const muscles = useMuscleGroups()
  const toggleFav = useToggleFavorite()
  const deleteEx = useDeleteExercise()

  const exercise = exercises.data?.find((e) => e.id === id)

  if (exercises.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!exercise) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Exercício não encontrado.</p>
        <Link to="/library" className="mt-4 inline-block text-sm text-primary">
          Voltar à biblioteca
        </Link>
      </div>
    )
  }

  const muscle = muscles.data?.find((m) => m.id === exercise.primaryMuscleId)
  const muscleColor = MUSCLE_COLORS[exercise.primaryMuscleId] ?? '#64748b'
  const secondaries = exercise.secondaryMuscles
    .map((id) => muscles.data?.find((m) => m.id === id)?.namePt)
    .filter(Boolean)

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 px-2 pt-3">
        <Link
          to="/library"
          className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <button
          type="button"
          onClick={() => toggleFav.mutate(exercise.id)}
          className={cn(
            'ml-auto inline-flex size-9 items-center justify-center rounded-full transition-colors',
            exercise.isFavorite
              ? 'text-primary'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          )}
          aria-pressed={exercise.isFavorite}
          aria-label={exercise.isFavorite ? 'Desfavoritar' : 'Favoritar'}
        >
          <Heart
            className={cn('size-5', exercise.isFavorite && 'fill-current')}
          />
        </button>
      </div>

      <div className="px-4 pt-4">
        <div
          className="flex h-32 items-center justify-center rounded-2xl text-3xl font-bold text-white"
          style={{ backgroundColor: muscleColor }}
          aria-hidden="true"
        >
          {muscle?.namePt}
        </div>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          {exercise.name}
        </h1>

        <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
          <Tag>{muscle?.namePt}</Tag>
          {secondaries.map((s) => (
            <Tag key={s} muted>
              {s}
            </Tag>
          ))}
          <Tag muted>{EQUIPMENT_LABELS[exercise.equipment]}</Tag>
          <Tag muted>
            {exercise.difficulty === 'beginner'
              ? 'Iniciante'
              : exercise.difficulty === 'intermediate'
                ? 'Intermediário'
                : 'Avançado'}
          </Tag>
          {exercise.isCustom ? <Tag>Custom</Tag> : null}
        </div>
      </div>

      <section className="mt-6 px-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Como executar
        </h2>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
          {exercise.instructions}
        </p>
      </section>

      {exercise.isCustom ? (
        <div className="mt-8 px-4">
          <Button
            variant="destructive"
            onClick={async () => {
              if (!confirm('Apagar esse exercício?')) return
              await deleteEx.mutateAsync(exercise.id)
              navigate('/library')
            }}
          >
            <Trash2 className="size-4" />
            Apagar exercício custom
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function Tag({
  children,
  muted,
}: {
  children: React.ReactNode
  muted?: boolean
}) {
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-0.5',
        muted
          ? 'bg-secondary text-secondary-foreground'
          : 'bg-primary/15 text-primary',
      )}
    >
      {children}
    </span>
  )
}
