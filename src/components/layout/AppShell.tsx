import { NavLink, Outlet } from 'react-router-dom'
import { BarChart3, Dumbbell, History, Home, LibraryBig } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/library', label: 'Exercícios', icon: LibraryBig, end: false },
  { to: '/workouts', label: 'Treinos', icon: Dumbbell, end: false },
  { to: '/history', label: 'Histórico', icon: History, end: false },
  { to: '/progress', label: 'Evolução', icon: BarChart3, end: false },
] as const

export function AppShell() {
  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <main className="flex-1 overflow-y-auto safe-top">
        <Outlet />
      </main>

      <nav
        className="border-t border-border bg-background/95 backdrop-blur safe-bottom"
        aria-label="Navegação principal"
      >
        <ul className="mx-auto flex max-w-2xl items-stretch justify-around">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-1 px-2 py-2.5 text-xs transition-colors',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                <Icon className="size-5" aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
