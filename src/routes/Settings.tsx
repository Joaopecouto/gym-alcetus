import { ArrowLeft, LogOut, Moon, Pencil, Sun, SunMoon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useSettings, type Theme } from '@/stores/settings'
import { useUser } from '@/stores/user'
import { cn } from '@/lib/utils'

const THEMES: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: SunMoon },
]

export function SettingsRoute() {
  const user = useUser((s) => s.user)
  const signOut = useUser((s) => s.signOut)
  const theme = useSettings((s) => s.theme)
  const setTheme = useSettings((s) => s.setTheme)

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 px-2 pt-3">
        <Link
          to="/"
          className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-semibold">Configurações</h1>
      </div>

      {user ? (
        <section className="mx-4 mt-4 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            {user.picture ? (
              <img
                src={user.picture}
                alt=""
                className="size-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {user.name[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{user.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {user.email}
              </p>
            </div>
            <Link
              to="/settings/profile"
              className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
              aria-label="Editar perfil"
            >
              <Pencil className="size-4" />
            </Link>
          </div>

          <dl className="mt-4 space-y-1.5 text-sm">
            <Row label="Idade" value={user.age ? `${user.age} anos` : '—'} />
            <Row
              label="Sexo"
              value={
                user.sex === 'male'
                  ? 'Masculino'
                  : user.sex === 'female'
                    ? 'Feminino'
                    : user.sex === 'other'
                      ? 'Outro'
                      : '—'
              }
            />
            <Row
              label="Peso"
              value={user.weightKg ? `${user.weightKg} kg` : '—'}
            />
            <Row
              label="Altura"
              value={user.heightCm ? `${user.heightCm} cm` : '—'}
            />
            <Row
              label="Objetivo"
              value={
                user.goal === 'hypertrophy'
                  ? 'Hipertrofia'
                  : user.goal === 'strength'
                    ? 'Força'
                    : user.goal === 'endurance'
                      ? 'Resistência'
                      : user.goal === 'general'
                        ? 'Geral'
                        : '—'
              }
            />
            <Row
              label="Frequência"
              value={
                user.weeklyFrequency
                  ? `${user.weeklyFrequency}× por semana`
                  : '—'
              }
            />
          </dl>
        </section>
      ) : null}

      <section className="mx-4 mt-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Aparência
        </h2>
        <div className="mt-2 grid grid-cols-3 gap-1 rounded-md bg-secondary p-1">
          {THEMES.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTheme(t.value)}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-md py-2 text-sm transition',
                  theme === t.value
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-4" />
                {t.label}
              </button>
            )
          })}
        </div>
      </section>

      <section className="mx-4 mt-8">
        <Button variant="outline" onClick={signOut} className="w-full">
          <LogOut className="size-4" />
          Sair
        </Button>
      </section>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
