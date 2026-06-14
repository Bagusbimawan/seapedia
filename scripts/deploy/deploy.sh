#!/usr/bin/env bash
# =============================================================================
# SEAPEDIA — Single deploy script (Amazon Linux / EC2)
# Native install: Go binary + Bun/Next.js (TANPA Docker)
# Database: eksternal / managed (TIDAK di-deploy script ini)
#
# Usage:
#   cp scripts/deploy/deploy.env.example scripts/deploy/deploy.env
#   # edit deploy.env (domain, DB eksternal, secrets)
#
#   sudo bash scripts/deploy/deploy.sh --setup     # pertama kali di VPS
#   sudo bash scripts/deploy/deploy.sh --migrate   # migrate + seed DB eksternal
#   sudo bash scripts/deploy/deploy.sh             # build & deploy BE + FE
#   sudo bash scripts/deploy/deploy.sh --ssl       # pasang HTTPS (setelah DNS aktif)
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="${DEPLOY_ENV:-$SCRIPT_DIR/deploy.env}"

APP_USER="${APP_USER:-seapedia}"
BACKEND_BIN="${BACKEND_BIN:-/opt/seapedia/bin/seapedia-api}"
BACKEND_PORT=8080
FRONTEND_PORT=3000

log()  { echo "==> $*"; }
ok()   { echo "✓ $*"; }
die()  { echo "ERROR: $*" >&2; exit 1; }

# --- Load config (parse KEY=VALUE; jangan source — aman untuk ) $ ! di password) ---
load_env() {
  [[ -f "$ENV_FILE" ]] || die "deploy.env tidak ada. Copy dari deploy.env.example"
  local line key value
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ "$line" =~ ^[[:space:]]*$ ]] && continue
    [[ "$line" == *"="* ]] || continue
    key="${line%%=*}"
    value="${line#*=}"
    key="${key#"${key%%[![:space:]]*}"}"
    key="${key%"${key##*[![:space:]]}"}"
    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]}"}"
    if [[ "$value" =~ ^\'(.*)\'$ ]]; then
      value="${BASH_REMATCH[1]}"
    elif [[ "$value" =~ ^\"(.*)\"$ ]]; then
      value="${BASH_REMATCH[1]}"
    fi
    export "$key"="$value"
  done < "$ENV_FILE"
  APP_DIR="${APP_DIR:-$ROOT_DIR}"
}

require_var() {
  local name="$1"
  local val="${!name:-}"
  [[ -n "$val" ]] || die "Set $name di deploy.env"
  [[ "$val" != *"example.com"* && "$val" != *"CHANGE_ME"* && "$val" != *"your-db"* ]] \
    || die "Ganti placeholder $name di deploy.env"
}

validate_env() {
  load_env
  require_var FRONTEND_DOMAIN
  require_var API_DOMAIN
  require_var NEXT_PUBLIC_API_URL
  require_var DB_HOST
  require_var DB_PASSWORD
  require_var JWT_SECRET
  require_var CORS_ORIGINS
}

write_env_files() {
  load_env
  cat > "$APP_DIR/backend/.env" <<EOF
PORT=${BACKEND_PORT}
ENV=${ENV:-production}
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
DB_SSLMODE=${DB_SSLMODE:-require}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRY=${JWT_EXPIRY:-24h}
CORS_ORIGINS=${CORS_ORIGINS}
EOF
  cat > "$APP_DIR/frontend/.env.local" <<EOF
NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
EOF
  ok "backend/.env & frontend/.env.local"
}

# --- Amazon Linux package manager ---
pkg_install() {
  if command -v dnf >/dev/null 2>&1; then
    dnf install -y "$@"
  elif command -v yum >/dev/null 2>&1; then
    yum install -y "$@"
  else
    die "dnf/yum tidak ditemukan — script ini untuk Amazon Linux"
  fi
}

ensure_bun() {
  if command -v bun >/dev/null 2>&1; then return; fi
  if [[ -x /root/.bun/bin/bun ]]; then
    export PATH="/root/.bun/bin:$PATH"
    return
  fi
  if [[ -x /home/ec2-user/.bun/bin/bun ]]; then
    export PATH="/home/ec2-user/.bun/bin:$PATH"
    return
  fi
  log "Install Bun..."
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
}

# --- --setup: first-time server prep (Amazon Linux) ---
cmd_setup() {
  [[ "${EUID:-0}" -eq 0 ]] || die "Jalankan --setup dengan sudo"

  log "Update sistem..."
  if command -v dnf >/dev/null 2>&1; then dnf update -y; else yum update -y; fi

  log "Install paket dasar (Amazon Linux)..."
  pkg_install git nginx golang postgresql15 tar gzip

  # psql client (nama paket bisa beda di AL2 vs AL2023)
  command -v psql >/dev/null 2>&1 || pkg_install postgresql || true

  ensure_bun

  log "Buat user aplikasi: $APP_USER"
  id "$APP_USER" &>/dev/null || useradd -r -m -s /sbin/nologin "$APP_USER"

  mkdir -p /opt/seapedia/bin
  mkdir -p /var/log/seapedia
  chown -R "$APP_USER:$APP_USER" /opt/seapedia /var/log/seapedia

  systemctl enable nginx
  systemctl start nginx

  ok "Server Amazon Linux siap"
  echo ""
  echo "Langkah berikutnya:"
  echo "  1. Clone repo ke $APP_DIR (atau copy project)"
  echo "  2. cp scripts/deploy/deploy.env.example scripts/deploy/deploy.env"
  echo "  3. Edit deploy.env"
  echo "  4. sudo bash scripts/deploy/deploy.sh --migrate"
  echo "  5. sudo bash scripts/deploy/deploy.sh"
  echo "  6. sudo bash scripts/deploy/deploy.sh --ssl   (setelah DNS A-record aktif)"
}

# --- --migrate: schema + seed ke DB eksternal ---
cmd_migrate() {
  validate_env
  load_env

  command -v psql >/dev/null 2>&1 || die "psql tidak ada. Jalankan: sudo bash scripts/deploy/deploy.sh --setup"

  export PGPASSWORD="$DB_PASSWORD"
  CONN="host=$DB_HOST port=$DB_PORT user=$DB_USER dbname=$DB_NAME sslmode=${DB_SSLMODE:-require}"

  log "Migrate schema ke DB eksternal..."
  psql "$CONN" -f "$APP_DIR/backend/migrations/001_initial.up.sql" \
    || echo "(migrate mungkin sudah pernah dijalankan)"

  write_env_files
  log "Seed demo data..."
  cd "$APP_DIR/backend"
  set -a; source "$APP_DIR/backend/.env"; set +a
  go run ./seed/seed.go

  ok "Database eksternal siap"
}

# --- Build backend (Go native binary) ---
build_backend() {
  load_env
  log "Build backend..."
  mkdir -p "$(dirname "$BACKEND_BIN")"
  cd "$APP_DIR/backend"
  CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o "$BACKEND_BIN" ./cmd/api/main.go
  chown "$APP_USER:$APP_USER" "$BACKEND_BIN"
  ok "Backend binary: $BACKEND_BIN"
}

# --- Build frontend (Bun + Next.js) ---
build_frontend() {
  load_env
  ensure_bun
  log "Build frontend (NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL)..."
  cd "$APP_DIR/frontend"
  export NEXT_PUBLIC_API_URL
  bun install --frozen-lockfile
  bun run build
  chown -R "$APP_USER:$APP_USER" "$APP_DIR/frontend"
  ok "Frontend build selesai"
}

# --- systemd services ---
install_systemd() {
  load_env
  log "Install systemd services..."

  cat > /etc/systemd/system/seapedia-backend.service <<EOF
[Unit]
Description=SEAPEDIA Backend API
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${APP_USER}
Group=${APP_USER}
WorkingDirectory=${APP_DIR}/backend
EnvironmentFile=${APP_DIR}/backend/.env
ExecStart=${BACKEND_BIN}
Restart=always
RestartSec=5
StandardOutput=append:/var/log/seapedia/backend.log
StandardError=append:/var/log/seapedia/backend.log

[Install]
WantedBy=multi-user.target
EOF

  # Bun path untuk user seapedia
  BUN_BIN="$(command -v bun || echo /home/ec2-user/.bun/bin/bun)"
  [[ -x /root/.bun/bin/bun ]] && BUN_BIN="/root/.bun/bin/bun"

  cat > /etc/systemd/system/seapedia-frontend.service <<EOF
[Unit]
Description=SEAPEDIA Frontend (Next.js)
After=network-online.target seapedia-backend.service
Wants=network-online.target

[Service]
Type=simple
User=${APP_USER}
Group=${APP_USER}
WorkingDirectory=${APP_DIR}/frontend
EnvironmentFile=${APP_DIR}/frontend/.env.local
Environment=NODE_ENV=production PORT=${FRONTEND_PORT} HOSTNAME=127.0.0.1
ExecStart=${BUN_BIN} run start
Restart=always
RestartSec=5
StandardOutput=append:/var/log/seapedia/frontend.log
StandardError=append:/var/log/seapedia/frontend.log

[Install]
WantedBy=multi-user.target
EOF

  systemctl daemon-reload
  systemctl enable seapedia-backend seapedia-frontend
  ok "systemd services terpasang"
}

# --- Nginx reverse proxy ---
install_nginx() {
  load_env
  log "Konfigurasi Nginx..."

  sed \
    -e "s|__FRONTEND_DOMAIN__|${FRONTEND_DOMAIN}|g" \
    -e "s|__API_DOMAIN__|${API_DOMAIN}|g" \
    "$SCRIPT_DIR/nginx/seapedia.conf.template" \
    > /etc/nginx/conf.d/seapedia.conf

  # Hapus default server block jika bentrok (Amazon Linux)
  rm -f /etc/nginx/conf.d/default.conf 2>/dev/null || true

  nginx -t
  systemctl reload nginx
  ok "Nginx aktif"
}

restart_services() {
  log "Restart services..."
  systemctl restart seapedia-backend
  systemctl restart seapedia-frontend
  sleep 2
  systemctl is-active --quiet seapedia-backend  || die "Backend gagal start — cek: journalctl -u seapedia-backend"
  systemctl is-active --quiet seapedia-frontend || die "Frontend gagal start — cek: journalctl -u seapedia-frontend"
  ok "Backend :127.0.0.1:${BACKEND_PORT} | Frontend :127.0.0.1:${FRONTEND_PORT}"
}

# --- --ssl: Let's Encrypt ---
cmd_ssl() {
  [[ "${EUID:-0}" -eq 0 ]] || die "Jalankan --ssl dengan sudo"
  validate_env
  load_env
  require_var LETSENCRYPT_EMAIL

  pkg_install certbot python3-certbot-nginx 2>/dev/null \
    || pkg_install certbot 2>/dev/null \
    || die "Install certbot manual: dnf install certbot python3-certbot-nginx"

  certbot --nginx \
    -d "$FRONTEND_DOMAIN" \
    -d "$API_DOMAIN" \
    --non-interactive --agree-tos -m "$LETSENCRYPT_EMAIL" \
    --redirect

  ok "SSL aktif untuk $FRONTEND_DOMAIN & $API_DOMAIN"
}

# --- Main deploy: BE + FE + nginx + restart ---
cmd_deploy() {
  [[ "${EUID:-0}" -eq 0 ]] || die "Jalankan deploy dengan sudo"

  validate_env
  load_env

  # Pastikan APP_DIR = lokasi project
  if [[ "$APP_DIR" != "$ROOT_DIR" ]]; then
    log "APP_DIR=$APP_DIR (dari deploy.env)"
  fi

  write_env_files
  build_backend
  build_frontend
  install_systemd
  install_nginx
  restart_services

  echo ""
  echo "============================================"
  echo "  SEAPEDIA Deploy Selesai (Amazon Linux)"
  echo "============================================"
  echo "  Frontend : http://${FRONTEND_DOMAIN}"
  echo "  API      : http://${API_DOMAIN}/api/v1"
  echo "  Swagger  : http://${API_DOMAIN}/swagger/index.html"
  echo "  Database : ${DB_HOST}:${DB_PORT} (eksternal)"
  echo ""
  echo "  Pasang HTTPS: sudo bash scripts/deploy/deploy.sh --ssl"
  echo "  Logs: journalctl -u seapedia-backend -f"
  echo "============================================"
}

# --- Entrypoint ---
case "${1:-deploy}" in
  --setup)   cmd_setup ;;
  --migrate) cmd_migrate ;;
  --ssl)     cmd_ssl ;;
  deploy|--deploy|"") cmd_deploy ;;
  -h|--help)
    sed -n '2,14p' "$0"
    ;;
  *)
    die "Argumen tidak dikenal: $1. Pakai: --setup | --migrate | --ssl | (default deploy)"
    ;;
esac
