<p align="center"><img src="https://raw.githubusercontent.com/Joaopecouto/Joaopecouto/main/assets/projects/v2/gym.png" width="96" alt="Ícone do projeto"></p>

<h1 align="center">Gym Alcetus</h1>

<p align="center">App web de acompanhamento de treino (PWA) com métricas, gráficos de evolução e heatmap muscular.<br><sub><i>Fitness tracking web app (PWA) with metrics, progress charts and a muscle heatmap.</i></sub></p>

<p align="center">
  <kbd><img src="https://raw.githubusercontent.com/Joaopecouto/Joaopecouto/main/assets/icons/v2/react.svg" height="18" align="absmiddle" alt=""> React</kbd> <kbd><img src="https://raw.githubusercontent.com/Joaopecouto/Joaopecouto/main/assets/icons/v2/typescript.svg" height="18" align="absmiddle" alt=""> TypeScript</kbd> <kbd><img src="https://raw.githubusercontent.com/Joaopecouto/Joaopecouto/main/assets/icons/v2/vite.svg" height="18" align="absmiddle" alt=""> Vite</kbd> <kbd><img src="https://raw.githubusercontent.com/Joaopecouto/Joaopecouto/main/assets/icons/v2/tailwind.svg" height="18" align="absmiddle" alt=""> Tailwind CSS</kbd> <kbd><img src="https://raw.githubusercontent.com/Joaopecouto/Joaopecouto/main/assets/icons/v2/zustand.svg" height="18" align="absmiddle" alt=""> Zustand</kbd> <kbd><img src="https://raw.githubusercontent.com/Joaopecouto/Joaopecouto/main/assets/icons/v2/tanstack-query.svg" height="18" align="absmiddle" alt=""> TanStack Query</kbd> <kbd><img src="https://raw.githubusercontent.com/Joaopecouto/Joaopecouto/main/assets/icons/v2/zod.svg" height="18" align="absmiddle" alt=""> Zod</kbd> <kbd><img src="https://raw.githubusercontent.com/Joaopecouto/Joaopecouto/main/assets/icons/v2/pwa.svg" height="18" align="absmiddle" alt=""> PWA</kbd> <kbd><img src="https://raw.githubusercontent.com/Joaopecouto/Joaopecouto/main/assets/icons/v2/fastify.svg" height="18" align="absmiddle" alt=""> Fastify</kbd> <kbd><img src="https://raw.githubusercontent.com/Joaopecouto/Joaopecouto/main/assets/icons/v2/sqlite.svg" height="18" align="absmiddle" alt=""> SQLite</kbd> <kbd><img src="https://raw.githubusercontent.com/Joaopecouto/Joaopecouto/main/assets/icons/v2/drizzle.svg" height="18" align="absmiddle" alt=""> Drizzle ORM</kbd> <kbd><img src="https://raw.githubusercontent.com/Joaopecouto/Joaopecouto/main/assets/icons/v2/docker.svg" height="18" align="absmiddle" alt=""> Docker</kbd> <kbd><img src="https://raw.githubusercontent.com/Joaopecouto/Joaopecouto/main/assets/icons/v2/nginx.svg" height="18" align="absmiddle" alt=""> Nginx</kbd>
</p>

Demo: [gym.alcetus.com](https://gym.alcetus.com)

## Português

App de treino instalável (PWA, funciona offline). Monte treinos e planos semanais, execute sessões com cronômetro de descanso, registre cada série (peso, repetições e RPE) e acompanhe a evolução com gráficos, heatmap muscular e medidas corporais.

### Funcionalidades

- Treinos customizáveis (hipertrofia e força) e planos semanais.
- Execução de sessão com timer de descanso e registro por série (peso, repetições e RPE).
- Gráficos de evolução: volume e **1RM estimado** (fórmula de Epley).
- Heatmap muscular e registro de medidas corporais.
- Catálogo com **mais de 100 exercícios** e criação de exercícios próprios.
- Login com Google e PWA com suporte offline.

### Stack

- **Front-end:** React 19, TypeScript, Vite, Tailwind CSS, Zustand, TanStack Query, React Hook Form e Zod, Recharts, dnd-kit e PWA (Workbox).
- **Back-end:** Node.js, Fastify 5, SQLite (libSQL), Drizzle ORM, login Google e JWT (jose).
- **Infra:** Docker e Nginx.

### Como rodar

```bash
# Front-end (raiz)
npm install
npm run dev

# Back-end (pasta server/)
cd server
npm install
npm run db:migrate   # cria o schema do banco
npm run db:seed      # popula o catálogo de exercícios
npm run dev
```

Crie um arquivo `.env` em `server/` com as credenciais do Google OAuth e a URL do banco (libSQL/SQLite).

## English

Installable workout app (PWA, works offline). Build workouts and weekly plans, run sessions with a rest timer, log every set (weight, reps and RPE) and track progress with charts, a muscle heatmap and body measurements.

### Features

- Customizable workouts (hypertrophy and strength) and weekly plans.
- Session runner with a rest timer and per-set logging (weight, reps and RPE).
- Progress charts: volume and **estimated 1RM** (Epley formula).
- Muscle heatmap and body-measurement tracking.
- Catalog with **100+ exercises** and custom exercise creation.
- Google sign-in and an offline-capable PWA.

### Stack

- **Front-end:** React 19, TypeScript, Vite, Tailwind CSS, Zustand, TanStack Query, React Hook Form and Zod, Recharts, dnd-kit and PWA (Workbox).
- **Back-end:** Node.js, Fastify 5, SQLite (libSQL), Drizzle ORM, Google login and JWT (jose).
- **Infra:** Docker and Nginx.

### Getting started

```bash
# Front-end (root)
npm install
npm run dev

# Back-end (server/ folder)
cd server
npm install
npm run db:migrate   # create the database schema
npm run db:seed      # seed the exercise catalog
npm run dev
```

Create a `.env` file in `server/` with your Google OAuth credentials and the database URL (libSQL/SQLite).

<sub>Contato · Contact: <a href="https://joaocouto.alcetus.com">joaocouto.alcetus.com</a> · <a href="mailto:joaopecouto77@gmail.com">joaopecouto77@gmail.com</a></sub>
