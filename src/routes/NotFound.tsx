import { Link } from 'react-router-dom'

export function NotFoundRoute() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-5xl font-semibold">404</p>
      <p className="text-muted-foreground">Página não encontrada.</p>
      <Link
        to="/"
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
      >
        Voltar ao início
      </Link>
    </div>
  )
}
