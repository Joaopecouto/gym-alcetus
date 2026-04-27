import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Input } from '@/components/ui/Input'
import { ScrollRow } from '@/components/ui/ScrollRow'
import { ExerciseCard } from '@/features/exercises/ExerciseCard'
import {
  useExercises,
  useMuscleGroups,
  useToggleFavorite,
} from '@/features/exercises/queries'
import { cn } from '@/lib/utils'
import { EQUIPMENT_LABELS, type Exercise } from '@/types'

const QUICK_FILTERS = [
  { id: 'fav', label: 'Favoritos' },
  { id: 'custom', label: 'Meus customs' },
] as const

export function LibraryRoute() {
  const exercisesQ = useExercises()
  const muscleGroupsQ = useMuscleGroups()
  const toggleFav = useToggleFavorite()

  const [search, setSearch] = useState('')
  const [muscle, setMuscle] = useState<string | null>(null)
  const [equipment, setEquipment] = useState<string | null>(null)
  const [quick, setQuick] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const list = exercisesQ.data ?? []
    const q = search.trim().toLowerCase()
    return list.filter((e) => {
      if (muscle && e.primaryMuscleId !== muscle) return false
      if (equipment && e.equipment !== equipment) return false
      if (quick === 'fav' && !e.isFavorite) return false
      if (quick === 'custom' && !e.isCustom) return false
      if (q && !e.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [exercisesQ.data, search, muscle, equipment, quick])

  const hasFilter = !!(search || muscle || equipment || quick)

  return (
    <div className="pb-4">
      <PageHeader
        title="Biblioteca"
        subtitle={`${exercisesQ.data?.length ?? 0} exercícios`}
        action={
          <Link
            to="/library/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent"
          >
            <Plus className="size-4" />
            Novo
          </Link>
        }
      />

      <div className="space-y-3 px-4 pt-2">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Buscar exercício…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-accent"
              aria-label="Limpar busca"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        <FilterRow>
          {QUICK_FILTERS.map((f) => (
            <Chip
              key={f.id}
              active={quick === f.id}
              onClick={() => setQuick(quick === f.id ? null : f.id)}
            >
              {f.label}
            </Chip>
          ))}
          <Chip
            active={muscle === null}
            onClick={() => setMuscle(null)}
            tone="muted"
          >
            Todos músculos
          </Chip>
          {muscleGroupsQ.data?.map((m) => (
            <Chip
              key={m.id}
              active={muscle === m.id}
              onClick={() => setMuscle(muscle === m.id ? null : m.id)}
            >
              {m.namePt}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow>
          {Object.entries(EQUIPMENT_LABELS).map(([k, v]) => (
            <Chip
              key={k}
              active={equipment === k}
              onClick={() => setEquipment(equipment === k ? null : k)}
              tone="muted"
            >
              {v}
            </Chip>
          ))}
        </FilterRow>
      </div>

      <div className="px-4 pt-4">
        {exercisesQ.isLoading ? (
          <div className="flex justify-center py-8">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : exercisesQ.error ? (
          <p className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            Erro: {(exercisesQ.error as Error).message}
          </p>
        ) : filtered.length === 0 ? (
          <EmptyState hasFilter={hasFilter} />
        ) : (
          <ul className="space-y-2">
            {filtered.map((e: Exercise) => (
              <ExerciseCard
                key={e.id}
                exercise={e}
                muscleGroups={muscleGroupsQ.data ?? []}
                onToggleFavorite={(id) => toggleFav.mutate(id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function FilterRow({ children }: { children: React.ReactNode }) {
  return <ScrollRow bleed>{children}</ScrollRow>
}

function Chip({
  children,
  active,
  onClick,
  tone = 'primary',
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  tone?: 'primary' | 'muted'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-3 py-1 text-xs transition-colors',
        active
          ? tone === 'primary'
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-foreground bg-foreground text-background'
          : 'border-border hover:bg-accent',
      )}
    >
      {children}
    </button>
  )
}

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {hasFilter
        ? 'Nada com esses filtros. Limpa um ou outro.'
        : 'Nenhum exercício ainda.'}
    </div>
  )
}
