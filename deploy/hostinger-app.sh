#!/usr/bin/env bash
# =============================================================================
#  Gym Alcetus — deploy do app na VPS Hostinger
# =============================================================================
#  Pré-requisito: rodou hostinger-setup.sh antes (Docker já instalado).
#
#  O que esse script faz:
#   1. Pede o repo Git (ou usa o que já tá clonado em /opt/gym-alcetus)
#   2. Clona/atualiza o código
#   3. Pede env vars (GOOGLE_CLIENT_ID, JWT_SECRET, domínio) se ainda não setadas
#   4. Faz `docker compose build` + `up -d`
#   5. Mostra status e logs
#
#  Cole inteiro no terminal browser do painel da Hostinger.
# =============================================================================

set -euo pipefail

APP_DIR="/opt/gym-alcetus"
ENV_FILE="$APP_DIR/server/.env"
ROOT_ENV_FILE="$APP_DIR/.env"

echo "==> Gym Alcetus deploy"

# -----------------------------------------------------------------------------
# 1. Repositório
# -----------------------------------------------------------------------------
if [ ! -d "$APP_DIR/.git" ]; then
  read -rp "URL do repositório Git (ex: https://github.com/voce/gym-alcetus.git): " REPO_URL
  if [ -z "$REPO_URL" ]; then
    echo "URL vazia, abortando"; exit 1
  fi
  git clone "$REPO_URL" "$APP_DIR"
else
  echo "==> Repo já existe em $APP_DIR, atualizando"
  git -C "$APP_DIR" fetch --all --prune
  git -C "$APP_DIR" reset --hard origin/main
fi

cd "$APP_DIR"

# -----------------------------------------------------------------------------
# 2. .env do servidor
# -----------------------------------------------------------------------------
if [ ! -f "$ENV_FILE" ]; then
  echo "==> Criando server/.env"
  read -rp "GOOGLE_CLIENT_ID (do Google Cloud Console): " GOOGLE_CLIENT_ID
  if [ -z "$GOOGLE_CLIENT_ID" ]; then
    echo "GOOGLE_CLIENT_ID vazio, abortando"; exit 1
  fi
  JWT_SECRET=$(openssl rand -base64 48)
  cat > "$ENV_FILE" <<EOF
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
JWT_SECRET=$JWT_SECRET
COOKIE_SECURE=true
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
EOF
  echo "==> .env gravado em $ENV_FILE"
else
  echo "==> server/.env já existe, mantendo"
  # Carrega GOOGLE_CLIENT_ID do server/.env pra reusar
  GOOGLE_CLIENT_ID=$(grep -E '^GOOGLE_CLIENT_ID=' "$ENV_FILE" | cut -d'=' -f2-)
fi

# .env na raiz é necessário pro docker-compose interpolar VITE_GOOGLE_CLIENT_ID
# como build arg (Dockerfile recebe via ARG e Vite injeta no bundle do front).
echo "==> Atualizando .env da raiz (build args do compose)"
cat > "$ROOT_ENV_FILE" <<EOF
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
EOF

# -----------------------------------------------------------------------------
# 3. Build + up
# -----------------------------------------------------------------------------
echo "==> docker compose build (pode demorar 2–3 min na primeira vez)"
docker compose build

echo "==> Subindo container"
docker compose up -d

# -----------------------------------------------------------------------------
# 4. Status
# -----------------------------------------------------------------------------
sleep 3
echo
echo "==> Status:"
docker compose ps

echo
echo "==> Health check:"
curl -fsS http://127.0.0.1:3000/api/health || echo "  (health falhou — confira logs com: docker compose logs -f)"

echo
echo "Deploy OK. App rodando em http://127.0.0.1:3000 (interno)."
echo "Próximo: configurar nginx ou Cloudflare Tunnel pra expor com HTTPS."
echo "Veja deploy/nginx-gym-alcetus.conf e deploy/hostinger-tls.sh."
