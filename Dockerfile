# ---------- 1) build do frontend ----------
FROM node:22-alpine AS frontend-builder
ARG VITE_GOOGLE_CLIENT_ID=""
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- 2) build do servidor ----------
FROM node:22-alpine AS server-builder
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# ---------- 3) imagem final, mínima ----------
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV DB_PATH=/data/iron-track.db
ENV STATIC_DIR=/app/dist

# Apenas deps de produção (omit=dev cai pra ~30MB)
COPY server/package.json server/package-lock.json /app/server/
RUN cd /app/server && npm ci --omit=dev && npm cache clean --force

# Servidor compilado + migrations SQL
COPY --from=server-builder /app/server/dist /app/server/dist
COPY --from=server-builder /app/server/drizzle /app/server/drizzle

# Frontend (SPA estática)
COPY --from=frontend-builder /app/dist /app/dist

# Volume pro arquivo SQLite (persistido entre upgrades do container)
RUN mkdir -p /data && chown -R node:node /data
VOLUME ["/data"]

USER node
EXPOSE 3000

CMD ["node", "/app/server/dist/index.js"]
