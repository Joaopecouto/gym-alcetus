import { Dumbbell } from 'lucide-react'
import { GoogleSignInButton } from '@/features/auth/GoogleSignInButton'

export function LoginRoute() {
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
    </div>
  )
}
