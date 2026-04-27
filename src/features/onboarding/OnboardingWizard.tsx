import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type {
  Goal,
  Level,
  MuscleGroup,
  OnboardingPayload,
  Sex,
} from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { useUser } from '@/stores/user'

interface Props {
  initialName: string
  muscleGroups: MuscleGroup[]
}

interface FormState {
  name: string
  age: string
  sex: Sex | ''
  weightKg: string
  heightCm: string
  goal: Goal | ''
  level: Level | ''
  weeklyFrequency: number
  focusMuscles: string[]
}

const TOTAL_STEPS = 3

export function OnboardingWizard({ initialName, muscleGroups }: Props) {
  const setUser = useUser((s) => s.setUser)
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({
    name: initialName,
    age: '',
    sex: '',
    weightKg: '',
    heightCm: '',
    goal: '',
    level: '',
    weeklyFrequency: 3,
    focusMuscles: [],
  })

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function validateStep(s: number): string | null {
    if (s === 0) {
      if (!form.name.trim()) return 'Diz teu nome.'
      const age = Number(form.age)
      if (!Number.isInteger(age) || age < 10 || age > 120)
        return 'Idade entre 10 e 120.'
      if (!form.sex) return 'Selecione o sexo.'
      const w = Number(form.weightKg)
      if (!w || w < 20 || w > 400) return 'Peso entre 20 e 400 kg.'
      const h = Number(form.heightCm)
      if (!h || h < 100 || h > 250) return 'Altura entre 100 e 250 cm.'
    }
    if (s === 1) {
      if (!form.goal) return 'Selecione um objetivo.'
      if (!form.level) return 'Selecione seu nível.'
      if (form.weeklyFrequency < 1 || form.weeklyFrequency > 7)
        return 'Frequência semanal de 1 a 7.'
    }
    return null
  }

  function next() {
    const err = validateStep(step)
    if (err) {
      setError(err)
      return
    }
    setError(null)
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
  }

  function prev() {
    setError(null)
    setStep((s) => Math.max(s - 1, 0))
  }

  async function finish() {
    const err = validateStep(0) ?? validateStep(1)
    if (err) {
      setError(err)
      setStep(err === validateStep(0) ? 0 : 1)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const payload: OnboardingPayload = {
        name: form.name.trim(),
        age: Number(form.age),
        sex: form.sex as Sex,
        weightKg: Number(form.weightKg),
        heightCm: Number(form.heightCm),
        goal: form.goal as Goal,
        level: form.level as Level,
        weeklyFrequency: form.weeklyFrequency,
        focusMuscles: form.focusMuscles,
      }
      const user = await api.saveOnboarding(payload)
      setUser(user)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao salvar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-md flex-col p-6">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Etapa {step + 1} de {TOTAL_STEPS}
        </p>
        <div className="mt-2 flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                i <= step ? 'bg-primary' : 'bg-secondary',
              )}
            />
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {step === 0 ? (
          <StepProfile form={form} update={update} />
        ) : step === 1 ? (
          <StepGoals form={form} update={update} muscleGroups={muscleGroups} />
        ) : (
          <StepReview form={form} muscleGroups={muscleGroups} />
        )}

        {error ? (
          <p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <footer className="mt-6 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={prev}
          disabled={step === 0 || submitting}
        >
          <ChevronLeft className="size-4" />
          Voltar
        </Button>

        {step < TOTAL_STEPS - 1 ? (
          <Button onClick={next} disabled={submitting}>
            Continuar
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button onClick={finish} disabled={submitting}>
            {submitting ? 'Salvando…' : 'Concluir'}
          </Button>
        )}
      </footer>
    </div>
  )
}

interface StepProps {
  form: FormState
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
}

function StepProfile({ form, update }: StepProps) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Sobre você</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Esses dados ficam só no seu app — usados pra calcular volume e ajudar
          nas recomendações.
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            autoComplete="name"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="age">Idade</Label>
            <Input
              id="age"
              inputMode="numeric"
              value={form.age}
              onChange={(e) => update('age', e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Sexo</Label>
            <SegmentedControl
              value={form.sex}
              onChange={(v) => update('sex', v as Sex)}
              options={[
                { value: 'male', label: 'M' },
                { value: 'female', label: 'F' },
                { value: 'other', label: 'Outro' },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="weight">Peso (kg)</Label>
            <Input
              id="weight"
              inputMode="decimal"
              value={form.weightKg}
              onChange={(e) =>
                update(
                  'weightKg',
                  e.target.value.replace(/[^\d.,]/g, '').replace(',', '.'),
                )
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="height">Altura (cm)</Label>
            <Input
              id="height"
              inputMode="numeric"
              value={form.heightCm}
              onChange={(e) =>
                update('heightCm', e.target.value.replace(/\D/g, ''))
              }
            />
          </div>
        </div>
      </div>
    </section>
  )
}

const GOAL_OPTIONS: Array<{ value: Goal; label: string; hint: string }> = [
  { value: 'hypertrophy', label: 'Hipertrofia', hint: '8–12 reps, descanso médio' },
  { value: 'strength', label: 'Força', hint: '3–6 reps, descanso longo' },
  { value: 'endurance', label: 'Resistência', hint: '15+ reps, descanso curto' },
  { value: 'general', label: 'Geral / Saúde', hint: 'Misto, foco em consistência' },
]

const LEVEL_OPTIONS: Array<{ value: Level; label: string }> = [
  { value: 'beginner', label: 'Iniciante' },
  { value: 'intermediate', label: 'Intermediário' },
  { value: 'advanced', label: 'Avançado' },
]

function StepGoals({
  form,
  update,
  muscleGroups,
}: StepProps & { muscleGroups: MuscleGroup[] }) {
  function toggleMuscle(id: string) {
    const has = form.focusMuscles.includes(id)
    update(
      'focusMuscles',
      has ? form.focusMuscles.filter((m) => m !== id) : [...form.focusMuscles, id],
    )
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Seus objetivos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          O modo de treino ajusta repetições e descanso automaticamente.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Objetivo principal</Label>
        <div className="grid gap-2">
          {GOAL_OPTIONS.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => update('goal', g.value)}
              className={cn(
                'flex flex-col items-start rounded-lg border p-3 text-left transition-colors',
                form.goal === g.value
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border hover:bg-accent',
              )}
            >
              <span className="font-medium">{g.label}</span>
              <span className="text-xs text-muted-foreground">{g.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Nível</Label>
        <SegmentedControl
          value={form.level}
          onChange={(v) => update('level', v as Level)}
          options={LEVEL_OPTIONS}
        />
      </div>

      <div className="space-y-2">
        <Label>Frequência semanal</Label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={1}
            max={7}
            value={form.weeklyFrequency}
            onChange={(e) =>
              update('weeklyFrequency', Number(e.target.value))
            }
            className="flex-1 accent-[var(--color-primary)]"
          />
          <span className="w-16 text-right tabular-nums text-sm font-medium">
            {form.weeklyFrequency}x/sem
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Foco muscular (opcional)</Label>
        <div className="flex flex-wrap gap-1.5">
          {muscleGroups.filter((m) => m.id !== 'cardio').map((m) => {
            const active = form.focusMuscles.includes(m.id)
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMuscle(m.id)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition-colors',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:bg-accent',
                )}
              >
                {m.namePt}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function StepReview({
  form,
  muscleGroups,
}: {
  form: FormState
  muscleGroups: MuscleGroup[]
}) {
  const focusLabels = form.focusMuscles
    .map((id) => muscleGroups.find((m) => m.id === id)?.namePt)
    .filter(Boolean)
    .join(', ')

  const goalLabel =
    GOAL_OPTIONS.find((g) => g.value === form.goal)?.label ?? form.goal
  const levelLabel =
    LEVEL_OPTIONS.find((l) => l.value === form.level)?.label ?? form.level

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Tudo certo?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Você pode editar isso depois em Configurações.
        </p>
      </div>

      <dl className="space-y-1 rounded-xl border border-border bg-card p-4 text-sm">
        <ReviewRow label="Nome" value={form.name} />
        <ReviewRow label="Idade" value={`${form.age} anos`} />
        <ReviewRow
          label="Sexo"
          value={
            form.sex === 'male'
              ? 'Masculino'
              : form.sex === 'female'
                ? 'Feminino'
                : 'Outro'
          }
        />
        <ReviewRow label="Peso" value={`${form.weightKg} kg`} />
        <ReviewRow label="Altura" value={`${form.heightCm} cm`} />
        <ReviewRow label="Objetivo" value={goalLabel} />
        <ReviewRow label="Nível" value={levelLabel} />
        <ReviewRow
          label="Frequência"
          value={`${form.weeklyFrequency}x por semana`}
        />
        {focusLabels ? (
          <ReviewRow label="Foco muscular" value={focusLabels} />
        ) : null}
      </dl>
    </section>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}

interface SegmentedOption {
  value: string
  label: string
}

function SegmentedControl({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: SegmentedOption[]
}) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-secondary p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm transition-colors',
            value === o.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
