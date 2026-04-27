import { Heart, Lock, User as UserIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  EQUIPMENT_LABELS,
  MUSCLE_COLORS,
  type Exercise,
  type MuscleGroup,
} from '@/types'

interface Props {
  exercise: Exercise
  muscleGroups: MuscleGroup[]
  onToggleFavorite?: (id: string) => void
  to?: string
}

export function ExerciseCard({
  exercise,
  muscleGroups,
  onToggleFavorite,
  to,
}: Props) {
  const muscle = muscleGroups.find((m) => m.id === exercise.primaryMuscleId)
  const muscleColor = MUSCLE_COLORS[exercise.primaryMuscleId] ?? '#64748b'
  const equipmentLabel =
    EQUIPMENT_LABELS[exercise.equipment] ?? exercise.equipment

  const linkTo = to ?? `/library/${exercise.id}`

  return (
    <li className="group relative flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground">
      <Link
        to={linkTo}
        className="absolute inset-0 rounded-xl focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={exercise.name}
      />

      <div
        className="flex size-12 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
        style={{ backgroundColor: muscleColor }}
        aria-hidden="true"
      >
        {muscle?.namePt.slice(0, 3).toUpperCase() ?? '?'}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{exercise.name}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{muscle?.namePt}</span>
          <span aria-hidden>·</span>
          <span>{equipmentLabel}</span>
          {exercise.isCustom ? (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-0.5">
                <UserIcon className="size-3" aria-hidden="true" />
                seu
              </span>
            </>
          ) : null}
          {exercise.difficulty === 'advanced' ? (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-0.5">
                <Lock className="size-3" aria-hidden="true" />
                avançado
              </span>
            </>
          ) : null}
        </p>
      </div>

      {onToggleFavorite ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onToggleFavorite(exercise.id)
          }}
          className={cn(
            'relative z-10 flex size-9 items-center justify-center rounded-full transition-colors',
            exercise.isFavorite
              ? 'text-primary hover:bg-primary/10'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          )}
          aria-label={
            exercise.isFavorite ? 'Remover dos favoritos' : 'Favoritar'
          }
          aria-pressed={exercise.isFavorite}
        >
          <Heart
            className={cn('size-4', exercise.isFavorite && 'fill-current')}
            aria-hidden="true"
          />
        </button>
      ) : null}
    </li>
  )
}
