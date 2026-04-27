import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import {
  useCreateCustomExercise,
  useMuscleGroups,
} from '@/features/exercises/queries'
import { EQUIPMENT_LABELS, type Level } from '@/types'

const LEVELS: Array<{ value: Level; label: string }> = [
  { value: 'beginner', label: 'Iniciante' },
  { value: 'intermediate', label: 'Intermediário' },
  { value: 'advanced', label: 'Avançado' },
]

export function ExerciseNewRoute() {
  const navigate = useNavigate()
  const muscles = useMuscleGroups()
  const create = useCreateCustomExercise()

  const [name, setName] = useState('')
  const [primaryMuscleId, setPrimary] = useState('')
  const [equipment, setEquipment] = useState('bodyweight')
  const [difficulty, setDifficulty] = useState<Level>('beginner')
  const [instructions, setInstructions] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (!name.trim()) {
      setError('Diz o nome.')
      return
    }
    if (!primaryMuscleId) {
      setError('Escolha o grupo muscular principal.')
      return
    }
    if (!instructions.trim()) {
      setError('Descreve como executar.')
      return
    }
    setError(null)
    try {
      const ex = await create.mutateAsync({
        name: name.trim(),
        primaryMuscleId,
        secondaryMuscles: [],
        equipment,
        difficulty,
        instructions: instructions.trim(),
        imagePath: null,
      })
      navigate(`/library/${ex.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao criar.')
    }
  }

  return (
    <div className="pb-8">
      <div className="flex items-center gap-2 px-2 pt-3">
        <Link
          to="/library"
          className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-semibold">Novo exercício</h1>
      </div>

      <div className="space-y-5 px-4 pt-5">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Flexão diamante"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Grupo muscular principal</Label>
          <div className="flex flex-wrap gap-1.5">
            {muscles.data?.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPrimary(m.id)}
                className={
                  primaryMuscleId === m.id
                    ? 'rounded-full border border-primary bg-primary px-3 py-1 text-xs text-primary-foreground'
                    : 'rounded-full border border-border px-3 py-1 text-xs hover:bg-accent'
                }
              >
                {m.namePt}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="equipment">Equipamento</Label>
          <select
            id="equipment"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-base"
          >
            {Object.entries(EQUIPMENT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label>Dificuldade</Label>
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-secondary p-1">
            {LEVELS.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => setDifficulty(l.value)}
                className={
                  difficulty === l.value
                    ? 'rounded-md bg-background px-3 py-1.5 text-sm shadow-sm'
                    : 'rounded-md px-3 py-1.5 text-sm text-muted-foreground'
                }
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="instructions">Como executar</Label>
          <textarea
            id="instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Posicionamento, movimento, respiração…"
            rows={5}
            className="w-full rounded-md border border-input bg-background p-3 text-base"
          />
        </div>

        {error ? (
          <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Button
          onClick={submit}
          disabled={create.isPending}
          className="w-full"
          size="lg"
        >
          {create.isPending ? 'Criando…' : 'Criar exercício'}
        </Button>
      </div>
    </div>
  )
}
