#!/usr/bin/env bash
# Salin ke setup-prod-env.sh lalu isi kredensial RDS (file itu di .gitignore)
# cp scripts/setup-prod-env.example.sh scripts/setup-prod-env.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/backend/.env"

cat > "$ENV_FILE" <<'EOF'
PORT=8080
ENV=production
DB_HOST=YOUR_RDS_HOST
DB_PORT=5432
DB_USER=YOUR_DB_USER
DB_PASSWORD=YOUR_DB_PASSWORD
DB_NAME=YOUR_DB_NAME
DB_SSLMODE=require
CORS_ORIGINS=https://seapedia.fe.bagusbimawan.com
JWT_SECRET=YOUR_JWT_SECRET_MIN_32_CHARS
JWT_EXPIRY=24h
EOF

chmod 600 "$ENV_FILE"
echo "✓ Edit $ENV_FILE lalu: bash scripts/deploy-prod.sh"
