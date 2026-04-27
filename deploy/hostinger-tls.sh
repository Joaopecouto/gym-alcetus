#!/usr/bin/env bash
# =============================================================================
#  Iron Track — instala nginx + certbot e tira certificado TLS Let's Encrypt
# =============================================================================
#  Pré-requisito:
#    1. DNS apontando pro IP da VPS (registro A no Cloudflare/Hostinger)
#    2. App já rodando em 127.0.0.1:3000 (após hostinger-app.sh)
#
#  Uso:
#    bash deploy/hostinger-tls.sh seu-dominio.com seu@email.com
# =============================================================================

set -euo pipefail

DOMAIN=${1:-}
EMAIL=${2:-}

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "uso: $0 <dominio> <email>"
  exit 1
fi

REPO_DIR="/opt/iron-track"
CONF_SRC="$REPO_DIR/deploy/nginx-iron-track.conf"
CONF_DST="/etc/nginx/sites-available/iron-track"

echo "==> Instalando nginx + certbot"
apt-get update -y
apt-get install -y nginx certbot python3-certbot-nginx
mkdir -p /var/www/letsencrypt

echo "==> Aplicando config nginx pra $DOMAIN"
sed "s|SEU_DOMINIO|$DOMAIN|g" "$CONF_SRC" > "$CONF_DST"
ln -sf "$CONF_DST" /etc/nginx/sites-enabled/iron-track
rm -f /etc/nginx/sites-enabled/default

# Primeira reload só com o bloco HTTP (sem TLS ainda — ssl_certificate aponta
# pra arquivo que não existe). Vamos comentar o bloco 443 temporariamente.
TMP_CONF=$(mktemp)
awk 'BEGIN{p=1} /listen 443/{p=0} /^}/ && p==0 {p=1; next} p' "$CONF_DST" > "$TMP_CONF"
mv "$TMP_CONF" "$CONF_DST"
nginx -t && systemctl reload nginx

echo "==> Solicitando cert TLS via certbot"
certbot --nginx \
  -d "$DOMAIN" \
  --non-interactive \
  --agree-tos \
  -m "$EMAIL" \
  --redirect

echo "==> Aplicando config final (HTTP→HTTPS + reverse proxy)"
sed "s|SEU_DOMINIO|$DOMAIN|g" "$CONF_SRC" > "$CONF_DST"
nginx -t && systemctl reload nginx

echo
echo "TLS pronto. Acesse: https://$DOMAIN"
echo "Renovação automática já vem via cron do certbot."
