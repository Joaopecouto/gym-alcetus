import { useState } from 'react'
import { Activity, Dumbbell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MUSCLE_COLORS, type Exercise } from '@/types'

interface Props {
  exercise: Exercise
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const SIZE_CLASS = {
  sm: 'h-12 w-12 text-xs',
  md: 'h-20 w-20 text-sm',
  lg: 'h-40 rounded-2xl',
  xl: 'h-56 rounded-2xl',
}

export function ExerciseImage({ exercise, className, size = 'md' }: Props) {
  const [errored, setErrored] = useState(false)
  const color = MUSCLE_COLORS[exercise.primaryMuscleId] ?? '#64748b'

  const showImage = exercise.imagePath && !errored

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        size === 'sm' || size === 'md' ? 'rounded-lg' : 'rounded-2xl',
        SIZE_CLASS[size],
        className,
      )}
      style={
        showImage
          ? undefined
          : {
              backgroundImage: `linear-gradient(135deg, ${color}cc, ${color}66)`,
            }
      }
    >
      {showImage ? (
        <img
          src={exercise.imagePath!}
          alt={exercise.name}
          loading="lazy"
          onError={() => setErrored(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <Placeholder exercise={exercise} size={size} />
      )}
    </div>
  )
}

function Placeholder({
  exercise,
  size,
}: {
  exercise: Exercise
  size: 'sm' | 'md' | 'lg' | 'xl'
}) {
  // Pequeno: só ícone do equipamento.
  // Grande: ilustração mais elaborada.
  const Icon = exercise.equipment === 'bodyweight' ? Activity : Dumbbell

  if (size === 'sm') {
    return (
      <div className="flex h-full w-full items-center justify-center text-white/90">
        <Icon className="size-5" aria-hidden="true" />
      </div>
    )
  }

  if (size === 'md') {
    return (
      <div className="flex h-full w-full items-center justify-center text-white/90">
        <Icon className="size-7" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-white">
      <Icon
        className={size === 'xl' ? 'size-16' : 'size-12'}
        aria-hidden="true"
      />
      <p className="px-4 text-center text-sm font-medium opacity-90">
        {exercise.name}
      </p>
      <p className="text-[10px] uppercase tracking-wider opacity-70">
        Sem imagem · use a pasta exercise-images/
      </p>
    </div>
  )
}
