#!/usr/bin/env bash
# SEAPEDIA — setup nginx + systemd (Amazon Linux / Ubuntu EC2)
# Usage: sudo bash scripts/setup-nginx.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/lib/os-detect.sh
source "$ROOT/scripts/lib/os-detect.sh"

APP_USER="${APP_USER:-$(default_app_user)}"
APP_DIR="${APP_DIR:-$ROOT}"

if [[ $EUID -ne 0 ]]; then
  echo "Jalankan dengan sudo: sudo bash scripts/setup-nginx.sh"
  exit 1
fi

OS_ID="$(detect_os)"
OS_FAMILY="$(detect_os_family)"
echo "==> SEAPEDIA nginx setup (OS: $OS_ID, user: $APP_USER, app: $APP_DIR)"

echo "==> Install nginx (jika belum ada)"
install_nginx

echo "==> Copy nginx configs ke $(nginx_site_dir)"
install_nginx_site seapedia-fe "$ROOT/deploy/nginx/seapedia-fe.conf"
install_nginx_site seapedia-be "$ROOT/deploy/nginx/seapedia-be.conf"

# Hapus default server yang bentrok (Amazon Linux)
rm -f /etc/nginx/conf.d/default.conf 2>/dev/null || true
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

post_nginx_setup

echo "==> Test nginx config"
nginx -t

echo "==> Install systemd services"
sed "s|/opt/seapedia|$APP_DIR|g; s|User=ec2-user|User=$APP_USER|g" \
  "$ROOT/deploy/systemd/seapedia-backend.service" > /etc/systemd/system/seapedia-backend.service
sed "s|/opt/seapedia|$APP_DIR|g; s|User=ec2-user|User=$APP_USER|g" \
  "$ROOT/deploy/systemd/seapedia-frontend.service" > /etc/systemd/system/seapedia-frontend.service

BUN_PATH="$(command -v bun 2>/dev/null || echo /home/$APP_USER/.bun/bin/bun)"
if [[ ! -x "$BUN_PATH" ]]; then
  BUN_PATH="/usr/local/bin/bun"
fi
sed -i "s|/home/ec2-user/.bun/bin/bun|$BUN_PATH|g" /etc/systemd/system/seapedia-frontend.service

systemctl daemon-reload
systemctl enable seapedia-backend seapedia-frontend nginx

systemctl reload nginx || systemctl restart nginx

echo ""
echo "✓ Nginx + systemd terpasang ($OS_FAMILY)"
echo ""
echo "  Langkah berikutnya:"
echo "  1. Pastikan DNS A-record mengarah ke IP server ini"
echo "  2. Security Group EC2: buka port 80 & 443"
echo "  3. SSL (HTTPS):"
if [[ "$OS_FAMILY" == "amazon" ]]; then
  echo "     sudo dnf install -y certbot python3-certbot-nginx"
else
  echo "     sudo apt install -y certbot python3-certbot-nginx"
fi
echo "     sudo certbot --nginx -d seapedia.fe.bagusbimawan.com -d seapedia.be.bagusbimawan.com"
echo "  4. Deploy app: bash scripts/deploy-prod.sh"
echo ""
echo "  Cek status:"
echo "     sudo systemctl status nginx seapedia-backend seapedia-frontend"
