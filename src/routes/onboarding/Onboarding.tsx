import { Dumbbell } from 'lucide-react'
import { Link } from 'react-router-dom'

export function OnboardingRoute() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex size-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <Dumbbell className="size-10" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Iron Track</h1>
        <p className="text-muted-foreground">
          Seu acompanhamento de treino, offline e na palma da mão.
        </p>
      </div>
      <p className="max-w-sm text-sm text-muted-foreground">
        O wizard de configuração completo (perfil, objetivos e instalação na tela inicial) virá na próxima fase.
      </p>
      <Link
        to="/"
        className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
      >
        Explorar o app
      </Link>
    </div>
  )
}
