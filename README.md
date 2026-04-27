# Iron Track

Acompanhamento de treinos em web app — login com Google, dados num SQLite na sua VPS, ~50MB de RAM idle no servidor. Acessa do iPhone via Safari ("Adicionar à Tela de Início" deixa com cara de app, em PWA).

## Stack

### Frontend (`/src`, `/public`, `/index.html`)
- **Vite 7** + **React 19** + **TypeScript**
- **Tailwind CSS v4** com tokens estilo shadcn/ui
- **Zustand** (auth + tema)
- **React Router v7**
- **Recharts**, **lucide-react**, **date-fns**, **react-hook-form + zod**, **@dnd-kit**
- **vite-plugin-pwa** (Service Worker pra cache de shell)
- Login via **Google Identity Services** (script `gsi/client`)

### Backend (`/server`)
- **Node 22** + **Fastify 5** + **TypeScript**
- **Drizzle ORM** + **@libsql/client** (SQLite, sem build nativo)
- **google-auth-library** (verificação de ID token)
- **jose** (JWT de sessão em cookie httpOnly)

### Deploy
- Container **Docker** único — Fastify serve API (`/api/*`) e SPA estática (resto)
- Hospedagem: **VPS Hostinger** com nginx na frente + TLS Let's Encrypt
- Banco SQLite num volume Docker persistido (`iron-track-data`)

## Scripts

### Frontend (raiz)
```bash
npm run dev       # vite dev server em http://localhost:5173
npm run build     # typecheck + build em ./dist
npm run preview   # serve o build local
npm run lint      # ESLint
```

### Backend (`/server`)
```bash
cd server
npm run dev          # tsx watch (hot reload)
npm run build        # tsc → ./dist
npm start            # node dist/index.js (precisa env vars)
npm run db:generate  # drizzle-kit gera migration nova a partir do schema
npm run db:migrate   # aplica migrations no SQLite local
npm run db:seed      # roda seed de muscle_groups + exercises (manual; auto-seed também acontece no boot se a tabela tiver vazia)
```

## Dev local

Você precisa de **2 terminais**:

```bash
# terminal 1 — backend
cd server
cp .env.example .env       # edite GOOGLE_CLIENT_ID e JWT_SECRET
npm install
npm run db:migrate
npm run dev                 # http://localhost:3000

# terminal 2 — frontend
echo 'VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com' > .env.local
npm install                 # se ainda não rodou
npm run dev                 # http://localhost:5173 (proxia /api → :3000)
```

Pra testar Google Sign-In em dev, adicione `http://localhost:5173` em **Authorized JavaScript origins** no Google Cloud Console.

## Deploy na VPS Hostinger

Tudo automatizado via scripts em `/deploy`. Veja `deploy/README.md` — é literalmente copia-e-cola no terminal browser do painel da Hostinger.

Resumo:
1. `deploy/hostinger-setup.sh` — instala Docker e firewall (1x na vida)
2. `deploy/hostinger-app.sh` — clona repo, pede env vars, sobe `docker compose`
3. `deploy/hostinger-tls.sh` — nginx + certbot pra HTTPS

## Estrutura do repo

```
/
├── src/                  # frontend (Vite + React)
│   ├── routes/           # páginas (Home, Library, Workouts, History, Progress, Login, Onboarding)
│   ├── features/         # módulos por domínio (auth, onboarding, ...)
│   ├── components/       # ui/, layout/, charts/
│   ├── lib/              # api client, cn, calc-1rm, storage
│   ├── stores/           # Zustand (user, settings)
│   └── types.ts          # tipos compartilhados (mirror dos retornos da API)
├── server/               # backend (Fastify + Drizzle + SQLite)
│   ├── src/
│   │   ├── auth/         # google ID verify + JWT session
│   │   ├── db/           # client, schema, seed
│   │   ├── routes/       # auth, me, catalog, workouts, sessions
│   │   ├── config.ts
│   │   └── index.ts      # boot Fastify + serve SPA
│   ├── drizzle/          # migrations geradas
│   └── data/             # SQLite mora aqui (gitignored)
├── deploy/               # scripts pra Hostinger
├── public/               # estáticos (favicon, manifest icons)
├── Dockerfile            # multi-stage build
└── docker-compose.yml
```

## Roadmap

Plano completo em `~/.claude/plans/ron-track-um-app-pure-hellman.md`.

| Fase | Status |
|---|---|
| 0. Setup (Vite, TS, Tailwind, PWA) | ✅ |
| 1. Backend Fastify + Drizzle + SQLite + auth Google + onboarding | ✅ |
| 2. Biblioteca de exercícios (UI completa de busca/filtros/customs) | ⏳ Próxima |
| 3. Criador de treinos (templates ABC, Push/Pull/Legs etc.) | ⏳ |
| 4. Execução de treino com timer de descanso | ⏳ |
| 5. Planejamento semanal | ⏳ |
| 6. Histórico + gráficos de evolução | ⏳ |
| 7. Polimento (dark mode, export, medidas corporais) | ⏳ |
