#!/usr/bin/env bash
# SEAPEDIA — production deploy (jalankan di EC2 setelah git pull)
# Usage: bash scripts/deploy-prod.sh
#
# Prasyarat (sekali):
#   bash scripts/setup-prod-env.sh   # tulis backend/.env
#   sudo bash scripts/setup-nginx.sh # nginx + systemd
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
APP_DIR="$ROOT"

echo "==> SEAPEDIA production deploy"
echo "    Repo: $ROOT"

if [[ ! -f backend/.env ]]; then
  echo "ERROR: backend/.env tidak ditemukan."
  echo "Jalankan dulu: bash scripts/setup-prod-env.sh"
  exit 1
fi

if [[ ! -f /etc/nginx/sites-enabled/seapedia-fe ]]; then
  echo "WARNING: nginx belum disetup untuk seapedia.fe"
  echo "Jalankan sekali: sudo bash scripts/setup-nginx.sh"
fi

if [[ ! -f frontend/.env.production ]]; then
  echo "==> Buat frontend/.env.production"
  cat > frontend/.env.production <<'EOF'
NEXT_PUBLIC_API_URL=https://seapedia.be.bagusbimawan.com/api/v1
EOF
fi

echo "==> Backend: build"
cd "$ROOT/backend"
export PATH="$PATH:/usr/local/go/bin:$HOME/go/bin"
go mod download
CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o bin/seapedia ./cmd/api/main.go

echo "==> Backend: restart"
if systemctl list-unit-files seapedia-backend.service >/dev/null 2>&1 && \
   systemctl is-enabled seapedia-backend >/dev/null 2>&1; then
  sudo systemctl restart seapedia-backend
  echo "    systemctl restart seapedia-backend"
elif systemctl is-active --quiet seapedia-backend 2>/dev/null; then
  sudo systemctl restart seapedia-backend
  echo "    systemctl restart seapedia-backend"
elif command -v pm2 >/dev/null 2>&1 && pm2 describe seapedia-backend >/dev/null 2>&1; then
  pm2 restart seapedia-backend
  echo "    pm2 restart seapedia-backend"
else
  pkill -f 'bin/seapedia' 2>/dev/null || true
  nohup ./bin/seapedia > /var/log/seapedia-backend.log 2>&1 &
  echo "    started ./bin/seapedia (nohup)"
fi

echo "==> Frontend: install + build"
cd "$ROOT/frontend"
if command -v bun >/dev/null 2>&1; then
  bun install --frozen-lockfile 2>/dev/null || bun install
  bun run build
else
  npm ci 2>/dev/null || npm install
  npm run build
fi

echo "==> Frontend: restart"
if systemctl list-unit-files seapedia-frontend.service >/dev/null 2>&1 && \
   systemctl is-enabled seapedia-frontend >/dev/null 2>&1; then
  sudo systemctl restart seapedia-frontend
  echo "    systemctl restart seapedia-frontend"
elif systemctl is-active --quiet seapedia-frontend 2>/dev/null; then
  sudo systemctl restart seapedia-frontend
  echo "    systemctl restart seapedia-frontend"
elif command -v pm2 >/dev/null 2>&1 && pm2 describe seapedia-frontend >/dev/null 2>&1; then
  pm2 restart seapedia-frontend
  echo "    pm2 restart seapedia-frontend"
else
  pkill -f 'next-server' 2>/dev/null || true
  nohup bun run start -p 3000 > /var/log/seapedia-frontend.log 2>&1 &
  echo "    started next on :3000 (nohup)"
fi

echo ""
echo "✓ Deploy selesai"
echo "  FE: https://seapedia.fe.bagusbimawan.com"
echo "  BE: https://seapedia.be.bagusbimawan.com/api/v1"
echo ""
echo "  Health check:"
sleep 2
curl -sf "http://127.0.0.1:8080/api/v1/products?limit=1" >/dev/null && echo "  ✓ Backend OK (:8080)" || echo "  ✗ Backend tidak merespons di :8080"
curl -sf "http://127.0.0.1:3000" >/dev/null && echo "  ✓ Frontend OK (:3000)" || echo "  ✗ Frontend tidak merespons di :3000"
if command -v nginx >/dev/null 2>&1; then
  curl -sf -H "Host: seapedia.fe.bagusbimawan.com" "http://127.0.0.1/" >/dev/null && \
    echo "  ✓ Nginx FE proxy OK" || echo "  ✗ Nginx FE proxy gagal"
  curl -sf -H "Host: seapedia.be.bagusbimawan.com" "http://127.0.0.1/api/v1/products?limit=1" >/dev/null && \
    echo "  ✓ Nginx BE proxy OK" || echo "  ✗ Nginx BE proxy gagal"
else
  echo "  ○ Nginx tidak terpasang — jalankan: sudo bash scripts/setup-nginx.sh"
fi
