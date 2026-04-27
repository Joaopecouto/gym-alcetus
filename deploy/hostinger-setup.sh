#!/usr/bin/env bash
# =============================================================================
#  Iron Track — setup inicial da VPS Hostinger
# =============================================================================
#  Roda 1x na vida da VPS. Instala Docker, libera porta, cria usuário deploy.
#  Cole inteiro no terminal browser do painel da Hostinger e dá enter.
# =============================================================================

set -euo pipefail

echo "==> Atualizando o sistema"
apt-get update -y
apt-get upgrade -y

echo "==> Instalando utilitários"
apt-get install -y ca-certificates curl gnupg ufw git

echo "==> Instalando Docker (script oficial)"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

echo "==> Instalando docker compose plugin (se faltar)"
if ! docker compose version >/dev/null 2>&1; then
  apt-get install -y docker-compose-plugin
fi

echo "==> Habilitando Docker no boot"
systemctl enable --now docker

echo "==> Firewall: liberando 22 (SSH), 80 e 443"
ufw allow 22/tcp || true
ufw allow 80/tcp || true
ufw allow 443/tcp || true
ufw --force enable

echo
echo "Setup base OK. Próximo passo: rode deploy/hostinger-app.sh"
