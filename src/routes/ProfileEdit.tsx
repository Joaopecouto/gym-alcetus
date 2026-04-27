import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { ScrollRow } from '@/components/ui/ScrollRow'
import { useMuscleGroups } from '@/features/exercises/queries'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query'
import { cn } from '@/lib/utils'
import { useUser } from '@/stores/user'
import type { Goal, Level, OnboardingPayload, Sex } from '@/types'

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

const GOAL_OPTIONS: Array<{ value: Goal; label: string; hint: string }> = [
  { value: 'hypertrophy', label: 'Hipertrofia', hint: '8–12 reps' },
  { value: 'strength', label: 'Força', hint: '3–6 reps' },
  { value: 'endurance', label: 'Resistência', hint: '15+ reps' },
  { value: 'general', label: 'Geral / Saúde', hint: 'Misto' },
]

const LEVEL_OPTIONS: Array<{ value: Level; label: string }> = [
  { value: 'beginner', label: 'Iniciante' },
  { value: 'intermediate', label: 'Intermediário' },
  { value: 'advanced', label: 'Avançado' },
]

const SEX_OPTIONS: Array<{ value: Sex; label: string }> = [
  { value: 'male', label: 'M' },
  { value: 'female', label: 'F' },
  { value: 'other', label: 'Outro' },
]

export function ProfileEditRoute() {
  const user = useUser((s) => s.user)
  const setUser = useUser((s) => s.setUser)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const muscles = useMuscleGroups()

  const [form, setForm] = useState<FormState>({
    name: user?.name ?? '',
    age: user?.age?.toString() ?? '',
    sex: user?.sex ?? '',
    weightKg: user?.weightKg?.toString() ?? '',
    heightCm: user?.heightCm?.toString() ?? '',
    goal: user?.goal ?? '',
    level: user?.level ?? '',
    weeklyFrequency: user?.weeklyFrequency ?? 3,
    focusMuscles: user?.focusMuscles ?? [],
  })
  const [error, setError] = useState<string | null>(null)

  // Re-hidrata se user mudar (refetch ou hot-reload)
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        age: user.age?.toString() ?? '',
        sex: user.sex ?? '',
        weightKg: user.weightKg?.toString() ?? '',
        heightCm: user.heightCm?.toString() ?? '',
        goal: user.goal ?? '',
        level: user.level ?? '',
        weeklyFrequency: user.weeklyFrequency ?? 3,
        focusMuscles: user.focusMuscles ?? [],
      })
    }
  }, [user])

  const save = useMutation({
    mutationFn: (payload: OnboardingPayload) => api.saveOnboarding(payload),
    onSuccess: (updatedUser) => {
      setUser(updatedUser)
      qc.invalidateQueries({ queryKey: queryKeys.user })
      navigate('/settings')
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Falha ao salvar.')
    },
  })

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function toggleMuscle(id: string) {
    const has = form.focusMuscles.includes(id)
    update(
      'focusMuscles',
      has
        ? form.focusMuscles.filter((m) => m !== id)
        : [...form.focusMuscles, id],
    )
  }

  function submit() {
    if (!form.name.trim()) return setError('Diz teu nome.')
    const age = Number(form.age)
    if (!Number.isInteger(age) || age < 10 || age > 120)
      return setError('Idade entre 10 e 120.')
    if (!form.sex) return setError('Escolhe o sexo.')
    const w = Number(form.weightKg.replace(',', '.'))
    if (!w || w < 20 || w > 400) return setError('Peso entre 20 e 400 kg.')
    const h = Number(form.heightCm)
    if (!h || h < 100 || h > 250) return setError('Altura entre 100 e 250 cm.')
    if (!form.goal) return setError('Escolhe um objetivo.')
    if (!form.level) return setError('Escolhe seu nível.')

    setError(null)
    save.mutate({
      name: form.name.trim(),
      age,
      sex: form.sex as Sex,
      weightKg: w,
      heightCm: h,
      goal: form.goal as Goal,
      level: form.level as Level,
      weeklyFrequency: form.weeklyFrequency,
      focusMuscles: form.focusMuscles,
    })
  }

  return (
    <div className="pb-32">
      <div className="flex items-center gap-2 px-2 pt-3">
        <Link
          to="/settings"
          className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-semibold">Editar perfil</h1>
      </div>

      <div className="space-y-5 px-4 pt-5">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
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
              onChange={(e) =>
                update('age', e.target.value.replace(/\D/g, ''))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Sexo</Label>
            <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-secondary p-1">
              {SEX_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => update('sex', o.value)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm transition-colors',
                    form.sex === o.value
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground',
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
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
          <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-secondary p-1">
            {LEVEL_OPTIONS.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => update('level', l.value)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm transition-colors',
                  form.level === l.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground',
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
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
          <Label>Foco muscular</Label>
          <ScrollRow bleed>
            {muscles.data
              ?.filter((m) => m.id !== 'cardio')
              .map((m) => {
                const active = form.focusMuscles.includes(m.id)
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMuscle(m.id)}
                    className={cn(
                      'shrink-0 rounded-full border px-3 py-1 text-xs transition-colors',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:bg-accent',
                    )}
                  >
                    {m.namePt}
                  </button>
                )
              })}
          </ScrollRow>
        </div>

        {error ? (
          <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 backdrop-blur safe-bottom">
        <div className="mx-auto flex max-w-2xl items-center gap-2 p-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex-1"
            disabled={save.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={submit}
            disabled={save.isPending}
            className="flex-1"
          >
            {save.isPending ? 'Salvando…' : 'Salvar perfil'}
          </Button>
        </div>
      </div>
    </div>
  )
}
