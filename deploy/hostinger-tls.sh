#!/usr/bin/env bash
# =============================================================================
#  Gym Alcetus — instala nginx + certbot e tira certificado TLS Let's Encrypt
# =============================================================================
#  Pré-requisito:
#    1. DNS apontando pro IP da VPS (registro A no Cloudflare/Hostinger)
#    2. App já rodando em 127.0.0.1:3010 (após hostinger-app.sh)
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

REPO_DIR="/opt/gym-alcetus"
CONF_FINAL_SRC="$REPO_DIR/deploy/nginx-gym-alcetus.conf"
CONF_DST="/etc/nginx/sites-available/gym-alcetus"
CONF_LINK="/etc/nginx/sites-enabled/gym-alcetus"

echo "==> Instalando nginx + certbot"
apt-get update -y
apt-get install -y nginx certbot python3-certbot-nginx
mkdir -p /var/www/letsencrypt

echo "==> Limpando config nginx anterior (se existir)"
rm -f "$CONF_LINK"
rm -f /etc/nginx/sites-enabled/default

# -----------------------------------------------------------------------------
# Etapa 1: bootstrap — só HTTP, sem TLS, pro certbot validar o ACME challenge
# -----------------------------------------------------------------------------
echo "==> Aplicando config bootstrap (HTTP only) pra $DOMAIN"
cat > "$CONF_DST" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
    }

    location / {
        return 200 'bootstrap';
        add_header Content-Type text/plain;
    }
}
EOF

ln -sf "$CONF_DST" "$CONF_LINK"
nginx -t
systemctl restart nginx
systemctl enable nginx >/dev/null 2>&1 || true

# -----------------------------------------------------------------------------
# Etapa 2: certbot pega o cert TLS (modo standalone via webroot)
# -----------------------------------------------------------------------------
echo "==> Solicitando certificado TLS via Let's Encrypt"
certbot certonly \
  --webroot \
  -w /var/www/letsencrypt \
  -d "$DOMAIN" \
  --non-interactive \
  --agree-tos \
  -m "$EMAIL"

# -----------------------------------------------------------------------------
# Etapa 3: aplica config final (HTTP→HTTPS redirect + reverse proxy 443)
# -----------------------------------------------------------------------------
echo "==> Aplicando config final (HTTP→HTTPS + reverse proxy)"
sed "s|SEU_DOMINIO|$DOMAIN|g" "$CONF_FINAL_SRC" > "$CONF_DST"
nginx -t
systemctl restart nginx
systemctl enable nginx >/dev/null 2>&1 || true

# -----------------------------------------------------------------------------
# Etapa 4: renovação automática (já vem habilitada via systemd timer do certbot)
# -----------------------------------------------------------------------------
systemctl enable --now certbot.timer >/dev/null 2>&1 || true

echo
echo "TLS pronto. Acesse: https://$DOMAIN"
echo "Renovação automática rodando via systemd timer (certbot.timer)."
