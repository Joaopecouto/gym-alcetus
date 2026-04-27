import { Dumbbell } from 'lucide-react'
import { useState } from 'react'
import { GoogleSignInButton } from '@/features/auth/GoogleSignInButton'
import { Button } from '@/components/ui/Button'
import { useUser } from '@/stores/user'
import { api, ApiError } from '@/lib/api'

export function LoginRoute() {
  const setUser = useUser((s) => s.setUser)
  const [bypassing, setBypassing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function devBypass() {
    setBypassing(true)
    setError(null)
    try {
      const res = await fetch('/api/dev/bypass', {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) throw new ApiError(res.status, 'bypass failed')
      const me = await api.me()
      setUser(me)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao entrar.')
      setBypassing(false)
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 p-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <Dumbbell className="size-10" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Iron Track</h1>
          <p className="text-muted-foreground">
            Acompanhamento de treinos, evolução e histórico.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <GoogleSignInButton />
        <p className="max-w-xs text-xs text-muted-foreground">
          Login com Google. Usamos seu nome e e-mail só pra criar sua conta —
          nada é compartilhado.
        </p>
      </div>

      {import.meta.env.DEV ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Modo preview
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={devBypass}
            disabled={bypassing}
          >
            {bypassing ? 'Entrando…' : 'Entrar como demo (sem Google)'}
          </Button>
          {error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
