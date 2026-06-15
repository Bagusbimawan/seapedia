#!/usr/bin/env bash
# Reset database: drop all tables, migrate fresh, seed demo data.
# Usage (local):  cd backend && bash scripts/reset-db.sh
# Usage (prod):   cd /opt/seapedia/backend && bash scripts/reset-db.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" ]] && continue
    [[ "$line" != *"="* ]] && continue
    export "$line"
  done < .env
  set +a
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-seapedia}"
DB_NAME="${DB_NAME:-seapedia_db}"
DB_SSLMODE="${DB_SSLMODE:-disable}"
export PGPASSWORD="${DB_PASSWORD:?Set DB_PASSWORD in backend/.env}"

PSQL=(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1)

echo "==> RESET DATABASE: ${DB_NAME} @ ${DB_HOST}"
echo "    Semua data akan dihapus!"
sleep 2

echo "==> migrate down..."
"${PSQL[@]}" -f migrations/002_store_provision.down.sql 2>/dev/null || true
"${PSQL[@]}" -f migrations/001_initial.down.sql

echo "==> migrate up..."
"${PSQL[@]}" -f migrations/001_initial.up.sql
"${PSQL[@]}" -f migrations/002_store_provision.up.sql

echo "==> seed demo data..."
go run ./seed/seed.go

echo "✓ Database reset selesai"
echo ""
echo "  Akun demo:"
echo "    admin@seapedia.com  / admin123"
echo "    seller@seapedia.com / seller123"
echo "    buyer@seapedia.com  / buyer123"
echo "    driver@seapedia.com / driver123"
echo "    Voucher: DISC20"