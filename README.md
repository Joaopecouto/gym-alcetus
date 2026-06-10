<h1 align="center">Gym Alcetus 🏋️</h1>

<p align="center">
  Aplicação web de acompanhamento de treino (PWA) com métricas, gráficos de evolução e heatmap muscular.<br>
  <sub><i>Fitness tracking web app (PWA) with metrics, progress charts and a muscle heatmap.</i></sub>
</p>

<p align="center">
  <a href="https://gym.alcetus.com"><img src="https://img.shields.io/badge/Demo-gym.alcetus.com-1F4A7D?style=flat-square&logo=googlechrome&logoColor=white" alt="Demo"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white">
  <img src="https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white">
  <img src="https://img.shields.io/badge/Fastify-000000?style=flat-square&logo=fastify&logoColor=white">
  <img src="https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white">
  <img src="https://img.shields.io/badge/Drizzle-C5F74F?style=flat-square&logo=drizzle&logoColor=black">
  <img src="https://img.shields.io/badge/PWA-5A0FC8?style=flat-square&logo=pwa&logoColor=white">
</p>

---

## 🇧🇷 Português

App de treino instalável (PWA, funciona offline). Monte treinos e planos semanais, execute sessões com cronômetro de descanso, registre cada série (peso/reps/RPE) e acompanhe sua evolução com gráficos, heatmap muscular e medidas corporais.

### ✨ Funcionalidades
- 🏋️ Treinos customizáveis (hipertrofia/força) e planos semanais
- ⏱️ Execução de sessão com timer de descanso e log por série (peso, reps, RPE)
- 📈 Gráficos de evolução — volume e **1RM estimado** (fórmula de Epley)
- 🔥 Heatmap muscular e registro de medidas corporais
- 📚 Catálogo com **100+ exercícios** + criação de exercícios próprios
- 🔐 Login com Google · 📱 PWA com suporte offline

### 🛠️ Stack
- **Front-end:** React 19, TypeScript, Vite, Tailwind CSS, Zustand, TanStack Query, React Hook Form + Zod, Recharts, dnd-kit, PWA (Workbox)
- **Back-end:** Node.js, Fastify 5, SQLite (libSQL), Drizzle ORM, login Google + JWT (jose)
- **Infra:** Docker, Nginx

### ▶️ Como rodar
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
> Crie um arquivo `.env` em `server/` com as credenciais do Google OAuth e a URL do banco (libSQL/SQLite).

---

## 🇺🇸 English

Installable workout app (PWA, works offline). Build workouts and weekly plans, run sessions with a rest timer, log every set (weight/reps/RPE) and track your progress with charts, a muscle heatmap and body measurements.

### ✨ Features
- 🏋️ Customizable workouts (hypertrophy/strength) and weekly plans
- ⏱️ Session runner with rest timer and per-set logging (weight, reps, RPE)
- 📈 Progress charts — volume and **estimated 1RM** (Epley formula)
- 🔥 Muscle heatmap and body-measurement tracking
- 📚 Catalog with **100+ exercises** + custom exercise creation
- 🔐 Google sign-in · 📱 Offline-capable PWA

### 🛠️ Stack
- **Front-end:** React 19, TypeScript, Vite, Tailwind CSS, Zustand, TanStack Query, React Hook Form + Zod, Recharts, dnd-kit, PWA (Workbox)
- **Back-end:** Node.js, Fastify 5, SQLite (libSQL), Drizzle ORM, Google login + JWT (jose)
- **Infra:** Docker, Nginx

### ▶️ Getting started
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
> Create a `.env` file in `server/` with your Google OAuth credentials and the database URL (libSQL/SQLite).
