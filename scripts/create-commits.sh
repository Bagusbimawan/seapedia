#!/usr/bin/env bash
# Create incremental commit history for SEAPEDIA delivery.
# Run from repo root: bash scripts/create-commits.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  git init
fi

# Unstage everything — each commit adds only its own files
git reset HEAD 2>/dev/null || true
git checkout -- . 2>/dev/null || true

commit() {
  local msg="$1"
  shift
  if [ "$#" -eq 0 ]; then
    echo "skip empty: $msg"
    return
  fi
  git add "$@"
  if git diff --cached --quiet; then
    echo "skip (no changes): $msg"
    return
  fi
  git commit -m "$msg"
  echo "✓ $msg"
}

# ─── Phase 1: Infrastructure ───────────────────────────────────────────────
commit "chore: project infrastructure and entry point" \
  .gitignore docker-compose.yml \
  backend/go.mod backend/go.sum backend/.env.example backend/.air.toml backend/Makefile backend/Dockerfile \
  backend/migrations backend/internal/config backend/internal/pkg \
  backend/internal/domain backend/internal/repository/postgres/db.go backend/internal/repository/postgres/models.go \
  frontend/package.json frontend/bun.lock frontend/next.config.ts frontend/tailwind.config.ts \
  frontend/tsconfig.json frontend/postcss.config.mjs frontend/next-env.d.ts frontend/Dockerfile \
  frontend/.env.example frontend/src/types frontend/src/stores frontend/src/lib/api/client.ts \
  frontend/src/middleware.ts frontend/src/app/globals.css frontend/src/components/providers/QueryProvider.tsx \
  frontend/src/lib/format.ts frontend/src/lib/nav.ts

# ─── L1 Backend ─────────────────────────────────────────────────────────────
commit "feat: L1 - auth register, login, multi-role JWT, switch role" \
  backend/internal/repository/postgres/user_repo.go \
  backend/internal/usecase/auth \
  backend/internal/delivery/http/middleware \
  backend/internal/delivery/http/handler/auth_handler.go \
  backend/internal/delivery/http/handler/helpers.go \
  backend/internal/delivery/http/dto \
  backend/internal/delivery/http/router.go \
  backend/cmd/api/main.go

commit "feat: L1 - public app reviews endpoint" \
  backend/internal/repository/postgres/review_repo.go \
  backend/internal/usecase/review

# ─── L1 Frontend ────────────────────────────────────────────────────────────
commit "feat: L1 - login, register, role-select UI" \
  frontend/src/app/\(auth\) frontend/src/app/role-select \
  frontend/src/lib/api/auth.ts frontend/src/hooks/useAuth.ts \
  frontend/src/components/auth/DemoAccountsPanel.tsx frontend/src/app/layout.tsx

commit "feat: L1 - landing page, product listing, reusable components" \
  frontend/src/app/page.tsx frontend/src/app/\(public\)/layout.tsx \
  frontend/src/app/\(public\)/products/page.tsx frontend/src/app/\(public\)/products/\[id\]/page.tsx \
  frontend/src/components/ui frontend/src/components/layout \
  frontend/src/lib/api/products.ts frontend/src/lib/api/stores.ts

commit "feat: L1 - public review form and display" \
  frontend/src/app/\(public\)/reviews frontend/src/lib/api/reviews.ts

commit "feat: L1 - dashboard role shells" \
  frontend/src/app/\(dashboard\)/buyer/page.tsx \
  frontend/src/app/\(dashboard\)/seller/page.tsx \
  frontend/src/app/\(dashboard\)/driver/page.tsx \
  frontend/src/app/\(dashboard\)/admin/page.tsx \
  frontend/src/components/layout/DashboardLayout.tsx

# ─── L2 Backend ─────────────────────────────────────────────────────────────
commit "feat: L2 - seller store management" \
  backend/internal/repository/postgres/store_repo.go \
  backend/internal/usecase/store \
  backend/internal/delivery/http/handler/store_handler.go

commit "feat: L2 - product CRUD and public catalog" \
  backend/internal/repository/postgres/product_repo.go \
  backend/internal/usecase/product

# ─── L2 Frontend ────────────────────────────────────────────────────────────
commit "feat: L2 - seller dashboard UI" \
  frontend/src/app/\(dashboard\)/seller/store frontend/src/app/\(dashboard\)/seller/products \
  frontend/src/app/\(dashboard\)/seller/income

commit "feat: L2 - product detail and add to cart" \
  frontend/src/app/\(public\)/products/\[id\]/AddToCartButton.tsx \
  frontend/src/components/ui/ProductCard.tsx frontend/src/components/ui/ProductImage.tsx

# ─── L3 Backend ─────────────────────────────────────────────────────────────
commit "feat: L3 - buyer wallet and address management" \
  backend/internal/repository/postgres/wallet_repo.go \
  backend/internal/repository/postgres/address_repo.go \
  backend/internal/usecase/wallet backend/internal/usecase/address \
  backend/internal/delivery/http/handler/wallet_handler.go

commit "feat: L3 - cart with single-store enforcement" \
  backend/internal/repository/postgres/cart_repo.go \
  backend/internal/usecase/cart \
  backend/internal/delivery/http/handler/cart_handler.go

commit "feat: L3 - checkout with PPN formula and stock decrement" \
  backend/internal/repository/postgres/checkout_repo.go \
  backend/internal/usecase/checkout

commit "feat: L3 - order history for buyer and seller" \
  backend/internal/repository/postgres/order_repo.go \
  backend/internal/usecase/order

# ─── L3 Frontend ────────────────────────────────────────────────────────────
commit "feat: L3 - buyer wallet, addresses, cart UI" \
  frontend/src/app/\(dashboard\)/buyer/wallet frontend/src/app/\(dashboard\)/buyer/addresses \
  frontend/src/app/\(dashboard\)/buyer/cart frontend/src/lib/api/wallet.ts \
  frontend/src/lib/api/addresses.ts frontend/src/lib/api/cart.ts \
  frontend/src/hooks/useBuyerCart.ts frontend/src/components/ui/QuantityStepper.tsx

commit "feat: L3 - checkout flow and order history UI" \
  frontend/src/app/\(dashboard\)/buyer/checkout frontend/src/app/\(dashboard\)/buyer/orders \
  frontend/src/lib/api/orders.ts frontend/src/lib/apiError.ts

# ─── L4 ─────────────────────────────────────────────────────────────────────
commit "feat: L4 - voucher and promo system" \
  backend/internal/repository/postgres/discount_repo.go \
  backend/internal/usecase/discount \
  backend/internal/delivery/http/handler/discount_handler.go \
  frontend/src/lib/api/discounts.ts \
  frontend/src/app/\(dashboard\)/admin/discounts

commit "feat: L4 - seller order processing and income" \
  frontend/src/app/\(dashboard\)/seller/orders

# ─── L5 ─────────────────────────────────────────────────────────────────────
commit "feat: L5 - driver delivery workflow" \
  backend/internal/repository/postgres/delivery_repo.go \
  backend/internal/usecase/delivery \
  frontend/src/lib/api/delivery.ts

commit "feat: L5 - driver dashboard UI" \
  frontend/src/app/\(dashboard\)/driver/jobs frontend/src/app/\(dashboard\)/driver/history

# ─── L6 ─────────────────────────────────────────────────────────────────────
commit "feat: L6 - admin monitoring and overdue auto-refund" \
  backend/internal/repository/postgres/overdue_repo.go \
  backend/internal/repository/postgres/system_clock_repo.go \
  backend/internal/repository/postgres/helpers.go \
  backend/internal/usecase/admin backend/internal/usecase/overdue \
  frontend/src/lib/api/admin.ts

commit "feat: L6 - admin dashboard UI" \
  frontend/src/app/\(dashboard\)/admin/users frontend/src/app/\(dashboard\)/admin/stores \
  frontend/src/app/\(dashboard\)/admin/orders

# ─── L7 + Polish ────────────────────────────────────────────────────────────
commit "feat: L7 - multi-role sync and scoped query cache" \
  frontend/src/hooks/useRoleSwitch.ts frontend/src/components/auth/AuthSync.tsx \
  frontend/src/components/auth/RoleSwitcher.tsx frontend/src/lib/queryKeys.ts \
  frontend/src/lib/demoAccounts.ts

commit "feat: L7 - seed data and API smoke tests" \
  backend/seed/seed.go scripts/test-api.sh

# ─── Docs (delivery requirement) ────────────────────────────────────────────
commit "docs: swagger, README, security notes, and postman collection" \
  README.md SECURITY.md backend/docs docs/postman \
  SEAPEDIA_CLAUDE.md

# ─── Remaining ──────────────────────────────────────────────────────────────
remaining=$(git status --porcelain | awk '{print $2}' | grep -v '^\.cursor/' || true)
if [ -n "$remaining" ]; then
  commit "chore: remaining project files" $remaining
fi

echo ""
echo "Done! Commit history:"
git log --oneline
