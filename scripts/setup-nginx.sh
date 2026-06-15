#!/usr/bin/env bash
# SEAPEDIA — setup nginx + systemd (jalankan SEKALI di EC2, butuh sudo)
# Usage: sudo bash scripts/setup-nginx.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_USER="${SUDO_USER:-ubuntu}"
APP_DIR="${APP_DIR:-/opt/seapedia}"

if [[ $EUID -ne 0 ]]; then
  echo "Jalankan dengan sudo: sudo bash scripts/setup-nginx.sh"
  exit 1
fi

echo "==> Install nginx (jika belum ada)"
if ! command -v nginx >/dev/null 2>&1; then
  apt-get update -qq
  apt-get install -y nginx
fi

echo "==> Copy nginx site configs"
cp "$ROOT/deploy/nginx/seapedia-fe.conf" /etc/nginx/sites-available/seapedia-fe
cp "$ROOT/deploy/nginx/seapedia-be.conf" /etc/nginx/sites-available/seapedia-be
ln -sf /etc/nginx/sites-available/seapedia-fe /etc/nginx/sites-enabled/seapedia-fe
ln -sf /etc/nginx/sites-available/seapedia-be /etc/nginx/sites-enabled/seapedia-be
rm -f /etc/nginx/sites-enabled/default

echo "==> Test nginx config"
nginx -t

echo "==> Install systemd services"
sed "s|/opt/seapedia|$APP_DIR|g; s|User=ubuntu|User=$APP_USER|g" \
  "$ROOT/deploy/systemd/seapedia-backend.service" > /etc/systemd/system/seapedia-backend.service
sed "s|/opt/seapedia|$APP_DIR|g; s|User=ubuntu|User=$APP_USER|g" \
  "$ROOT/deploy/systemd/seapedia-frontend.service" > /etc/systemd/system/seapedia-frontend.service

# Deteksi path bun
BUN_PATH="$(command -v bun || echo /usr/local/bin/bun)"
sed -i "s|/usr/local/bin/bun|$BUN_PATH|g" /etc/systemd/system/seapedia-frontend.service

systemctl daemon-reload
systemctl enable seapedia-backend seapedia-frontend nginx

systemctl reload nginx || systemctl restart nginx

echo ""
echo "✓ Nginx + systemd terpasang"
echo ""
echo "  Langkah berikutnya:"
echo "  1. Pastikan DNS A-record mengarah ke IP server ini"
echo "  2. SSL (HTTPS) — jalankan:"
echo "     sudo apt install -y certbot python3-certbot-nginx"
echo "     sudo certbot --nginx -d seapedia.fe.bagusbimawan.com -d seapedia.be.bagusbimawan.com"
echo "  3. Deploy app: bash scripts/deploy-prod.sh"
echo ""
echo "  Cek status:"
echo "     sudo systemctl status nginx seapedia-backend seapedia-frontend"
