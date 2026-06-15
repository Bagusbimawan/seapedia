#!/usr/bin/env bash
# SEAPEDIA — update frontend saja (build + restart FE)
# Usage: bash scripts/deploy-prod-fe.sh
#
# Asumsi: repo, nginx, systemd sudah terpasang.
# Jalankan dari folder repo setelah git pull manual.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/lib/os-detect.sh
source "$ROOT/scripts/lib/os-detect.sh"

OS_FAMILY="$(detect_os_family)"

echo "==> SEAPEDIA update frontend ($OS_FAMILY)"

echo "==> Pastikan frontend/.env.production"
cat > frontend/.env.production <<'EOF'
NEXT_PUBLIC_API_URL=https://seapedia.be.bagusbimawan.com/api/v1
EOF
echo "    NEXT_PUBLIC_API_URL=https://seapedia.be.bagusbimawan.com/api/v1"

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
echo "✓ Frontend update selesai"
echo "  Tunggu service siap..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -sf "http://127.0.0.1:3000" >/dev/null 2>&1; then
    echo "  ✓ Frontend OK (:3000)"
    exit 0
  fi
  sleep 2
done
echo "  ✗ Frontend tidak merespons di :3000 — cek: sudo journalctl -u seapedia-frontend -n 50"
exit 1
