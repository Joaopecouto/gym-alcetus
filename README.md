# Iron Track

Acompanhamento de treinos em formato PWA — funciona offline, instala no iPhone via "Adicionar à Tela de Início", sem App Store, sem servidor.

## Stack

- **Vite 7** + **React 19** + **TypeScript**
- **Tailwind CSS v4** com tokens estilo shadcn/ui
- **Dexie** (IndexedDB) para dados 100% locais
- **Zustand** para estado global (tema etc.)
- **React Router v7** para navegação
- **Recharts**, **lucide-react**, **date-fns**, **react-hook-form + zod**, **@dnd-kit**
- **vite-plugin-pwa** (Workbox) para Service Worker e manifesto

## Scripts

```bash
npm run dev       # servidor de dev em http://localhost:5173
npm run build     # typecheck + build de produção em ./dist
npm run preview   # serve o build localmente pra testar PWA
npm run lint      # ESLint
```

## Estrutura

```
src/
  routes/          # componentes por tela (Home, Library, Workouts, History, Progress, Onboarding)
  features/        # módulos por domínio (exercises, workouts, sessions, plans, progress)
  components/
    layout/        # AppShell (tab bar) e PageHeader
    ui/            # primitivos estilo shadcn (a adicionar)
    charts/        # wrappers Recharts
  db/              # cliente Dexie + schema
  lib/             # utilidades (cn, calc-1rm, storage helpers)
  stores/          # Zustand stores
```

## Roadmap

Plano completo do app está em `~/.claude/plans/ron-track-um-app-pure-hellman.md`.

Fase atual: **0. Setup concluído** — projeto scaffolded, configurado, build passando.
Próxima: **1. Schema + Seed** (popular biblioteca de exercícios via wger.de).
