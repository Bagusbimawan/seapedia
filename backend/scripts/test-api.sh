#!/usr/bin/env bash
# SEAPEDIA — full API smoke + integration test (local)
set -uo pipefail

BASE="${BASE_URL:-http://localhost:8080/api/v1}"
PASS=0
FAIL=0
SKIP=0
declare -a FAILURES=()

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_pass() { echo -e "${GREEN}✓${NC} $1"; PASS=$((PASS + 1)); }
log_fail() { echo -e "${RED}✗${NC} $1"; FAIL=$((FAIL + 1)); FAILURES+=("$1"); }
log_skip() { echo -e "${YELLOW}○${NC} $1 (skipped)"; SKIP=$((SKIP + 1)); }
log_section() { echo ""; echo "━━━ $1 ━━━"; }

need_jq() {
  if ! command -v jq >/dev/null 2>&1; then
    echo "jq required. Install: brew install jq"
    exit 1
  fi
}

# usage: api METHOD PATH [JSON_BODY] [TOKEN]
api() {
  local method="$1" path="$2" body="${3:-}" token="${4:-}"
  local args=(-s -w "\n%{http_code}" -X "$method" "${BASE}${path}")
  args+=(-H "Content-Type: application/json")
  if [[ -n "$token" ]]; then args+=(-H "Authorization: Bearer $token"); fi
  if [[ -n "$body" ]]; then args+=(-d "$body"); fi
  local raw
  raw=$(curl "${args[@]}")
  HTTP_CODE=$(echo "$raw" | tail -n1)
  BODY=$(echo "$raw" | sed '$d')
}

assert_status() {
  local name="$1" expected="$2"
  if [[ "$HTTP_CODE" == "$expected" ]]; then
    log_pass "$name (HTTP $HTTP_CODE)"
    return 0
  fi
  local msg
  msg=$(echo "$BODY" | jq -r '.message // .error // empty' 2>/dev/null || true)
  log_fail "$name — expected HTTP $expected, got $HTTP_CODE ${msg:+($msg)}"
  return 1
}

assert_json_field() {
  local name="$1" jq_expr="$2" expected="$3"
  local actual
  actual=$(echo "$BODY" | jq -r "$jq_expr" 2>/dev/null || echo "")
  if [[ "$actual" == "$expected" ]]; then
    log_pass "$name ($jq_expr = $expected)"
    return 0
  fi
  log_fail "$name — expected $jq_expr=$expected, got '$actual'"
  return 1
}

assert_json_gt() {
  local name="$1" jq_expr="$2" min="$3"
  local actual
  actual=$(echo "$BODY" | jq -r "$jq_expr" 2>/dev/null || echo "0")
  if [[ "$actual" =~ ^[0-9]+$ ]] && (( actual > min )); then
    log_pass "$name ($actual > $min)"
    return 0
  fi
  if [[ "$actual" =~ ^[0-9]+$ ]] && (( actual >= min )); then
    log_pass "$name ($actual >= $min)"
    return 0
  fi
  log_fail "$name — expected $jq_expr >= $min, got '$actual'"
  return 1
}

login() {
  local email="$1" password="$2"
  BODY=$(api POST /auth/login "{\"email\":\"$email\",\"password\":\"$password\"}")
  HTTP_CODE=$(echo "$BODY" | jq -r 'empty' 2>/dev/null; true)
  # re-fetch with status
  local raw
  raw=$(curl -s -w "\n%{http_code}" -X POST "${BASE}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\"}")
  HTTP_CODE=$(echo "$raw" | tail -n1)
  BODY=$(echo "$raw" | sed '$d')
  echo "$BODY" | jq -r '.data.token // empty'
}

need_jq

echo "SEAPEDIA API Test Suite"
echo "Base URL: $BASE"
echo ""

# ── Health via public endpoint ───────────────────────────────────────────────
log_section "Public Endpoints"
api GET /products
assert_status "GET /products" 200
PRODUCT_ID=$(echo "$BODY" | jq -r '.data.items[0].id // .data[0].id // empty')
PRODUCT_COUNT=$(echo "$BODY" | jq -r '(.data.items // .data // []) | length')
if [[ -z "$PRODUCT_ID" || "$PRODUCT_ID" == "null" ]]; then
  log_fail "GET /products — no product id in response"
else
  log_pass "GET /products — found product $PRODUCT_ID (count: $PRODUCT_COUNT)"
fi

api GET "/products/$PRODUCT_ID"
assert_status "GET /products/:id" 200

STORE_ID=$(echo "$BODY" | jq -r '.data.store_id // empty')
api GET "/stores/$STORE_ID"
assert_status "GET /stores/:id" 200

api GET /demo/sellers
assert_status "GET /demo/sellers" 200

api GET /vouchers
assert_status "GET /vouchers" 200

api GET /promos
assert_status "GET /promos" 200

api GET /reviews
assert_status "GET /reviews" 200

# ── Auth ─────────────────────────────────────────────────────────────────────
log_section "Auth"
ADMIN_TOKEN=$(login admin@seapedia.com admin123)
SELLER_TOKEN=$(login seller@seapedia.com seller123)
BUYER_TOKEN=$(login buyer@seapedia.com buyer123)
DRIVER_TOKEN=$(login driver@seapedia.com driver123)

for role in ADMIN SELLER BUYER DRIVER; do
  var="${role}_TOKEN"
  if [[ -n "${!var}" ]]; then
    log_pass "POST /auth/login ($role)"
  else
    log_fail "POST /auth/login ($role) — no token"
  fi
done

api GET /auth/me "" "$BUYER_TOKEN"
assert_status "GET /auth/me (buyer)" 200
assert_json_field "auth/me email" '.data.email' "buyer@seapedia.com"

# Register new buyer (unique email)
RAND=$(date +%s)
REG_EMAIL="testbuyer${RAND}@test.local"
api POST /auth/register "{\"username\":\"testbuyer${RAND}\",\"email\":\"$REG_EMAIL\",\"password\":\"testpass123\",\"roles\":[\"BUYER\"]}"
assert_status "POST /auth/register" 201

# Switch role (multi-role user if exists — skip if login fails)
MULTI_TOKEN=$(login multi@seapedia.com multi123 2>/dev/null || true)
if [[ -n "$MULTI_TOKEN" ]]; then
  api POST /auth/switch-role '{"role":"SELLER"}' "$MULTI_TOKEN"
  assert_status "POST /auth/switch-role" 200
else
  log_skip "POST /auth/switch-role (no multi@ account)"
fi

# Pakai produk dari toko seller@ agar flow seller/driver konsisten
api GET /seller/store "" "$SELLER_TOKEN"
SELLER_STORE_ID=$(echo "$BODY" | jq -r '.data.id // empty')
api GET /products
PRODUCT_ID=$(echo "$BODY" | jq -r --arg sid "$SELLER_STORE_ID" '.data.items[]? | select(.store_id==$sid) | .id' | head -1)
if [[ -z "$PRODUCT_ID" || "$PRODUCT_ID" == "null" ]]; then
  PRODUCT_ID=$(echo "$BODY" | jq -r '.data.items[0].id // empty')
  log_skip "gunakan produk pertama (bukan dari toko seller@)"
else
  log_pass "Produk checkout dari toko seller@: $PRODUCT_ID"
fi

# ── Buyer: Wallet ────────────────────────────────────────────────────────────
log_section "Buyer — Wallet"
api GET /buyer/wallet "" "$BUYER_TOKEN"
assert_status "GET /buyer/wallet" 200
BALANCE_BEFORE=$(echo "$BODY" | jq -r '.data.balance // 0')
log_pass "Wallet balance before topup: Rp $BALANCE_BEFORE"

api POST /buyer/wallet/topup '{"amount":100000}' "$BUYER_TOKEN"
assert_status "POST /buyer/wallet/topup" 200
BALANCE_AFTER=$(echo "$BODY" | jq -r '.data.balance // 0')
EXPECTED=$((BALANCE_BEFORE + 100000))
if [[ "$BALANCE_AFTER" == "$EXPECTED" ]]; then
  log_pass "Topup balance correct ($BALANCE_BEFORE + 100000 = $BALANCE_AFTER)"
else
  log_fail "Topup balance wrong — expected $EXPECTED, got $BALANCE_AFTER"
fi

api GET /buyer/wallet/transactions "" "$BUYER_TOKEN"
assert_status "GET /buyer/wallet/transactions" 200
TX_COUNT=$(echo "$BODY" | jq -r '(.data.items // []) | length')
if (( TX_COUNT >= 1 )); then
  log_pass "Wallet transactions listed ($TX_COUNT tx)"
else
  log_fail "Wallet transactions empty after topup"
fi

# ── Buyer: Address ───────────────────────────────────────────────────────────
log_section "Buyer — Address"
api POST /buyer/addresses '{"label":"Rumah","street":"Jl. Test No.1","city":"Jakarta","zip_code":"12345","is_default":true}' "$BUYER_TOKEN"
assert_status "POST /buyer/addresses" 201
ADDRESS_ID=$(echo "$BODY" | jq -r '.data.id // empty')

api GET /buyer/addresses "" "$BUYER_TOKEN"
assert_status "GET /buyer/addresses" 200

api PUT "/buyer/addresses/$ADDRESS_ID" '{"label":"Rumah Utama","street":"Jl. Test No.1","city":"Jakarta","zip_code":"12345","is_default":true}' "$BUYER_TOKEN"
assert_status "PUT /buyer/addresses/:id" 200

api POST "/buyer/addresses/$ADDRESS_ID/set-default" '{}' "$BUYER_TOKEN"
assert_status "POST /buyer/addresses/:id/set-default" 200

# ── Buyer: Cart & Checkout ─────────────────────────────────────────────────────
log_section "Buyer — Cart"
api DELETE /buyer/cart "" "$BUYER_TOKEN"
if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "204" ]]; then
  log_pass "DELETE /buyer/cart (clear) (HTTP $HTTP_CODE)"
else
  log_fail "DELETE /buyer/cart (clear) — expected 200/204, got $HTTP_CODE"
fi

api POST /buyer/cart/items "{\"product_id\":\"$PRODUCT_ID\",\"quantity\":2}" "$BUYER_TOKEN"
assert_status "POST /buyer/cart/items" 200
CART_ITEMS=$(echo "$BODY" | jq -r '(.data.items // []) | length')
if (( CART_ITEMS >= 1 )); then
  log_pass "Cart has $CART_ITEMS item(s)"
  STORE_NAME=$(echo "$BODY" | jq -r '.data.items[0].store_name // empty')
  if [[ -n "$STORE_NAME" && "$STORE_NAME" != "null" ]]; then
    log_pass "Cart item has store_name: $STORE_NAME"
  else
    log_fail "Cart item missing store_name"
  fi
else
  log_fail "Cart empty after add item"
fi

api GET /buyer/cart "" "$BUYER_TOKEN"
assert_status "GET /buyer/cart" 200

api PUT "/buyer/cart/items/$PRODUCT_ID" '{"quantity":1}' "$BUYER_TOKEN"
assert_status "PUT /buyer/cart/items/:productId" 200

api POST /buyer/discount/validate '{"code":"DISC20","subtotal":100000}' "$BUYER_TOKEN"
assert_status "POST /buyer/discount/validate" 200 || log_skip "discount validate (DISC20 may not exist)"

api POST /buyer/checkout "{\"address_id\":\"$ADDRESS_ID\",\"delivery_method\":\"INSTANT\"}" "$BUYER_TOKEN"
if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
  log_pass "POST /buyer/checkout (HTTP $HTTP_CODE)"
  ORDER_ID=$(echo "$BODY" | jq -r '.data.orders[0].id // empty')
  ORDER_STATUS=$(echo "$BODY" | jq -r '.data.orders[0].status // empty')
  log_pass "Checkout created order $ORDER_ID (status: $ORDER_STATUS)"
else
  ORDER_ID=""
  log_fail "POST /buyer/checkout — expected 200/201, got $HTTP_CODE ($(echo "$BODY" | jq -r '.message // empty'))"
fi

api GET /buyer/orders "" "$BUYER_TOKEN"
assert_status "GET /buyer/orders" 200

if [[ -n "$ORDER_ID" ]]; then
  api GET "/buyer/orders/$ORDER_ID" "" "$BUYER_TOKEN"
  assert_status "GET /buyer/orders/:id" 200
fi

# ── Seller ───────────────────────────────────────────────────────────────────
log_section "Seller"
api GET /seller/store "" "$SELLER_TOKEN"
assert_status "GET /seller/store" 200

api PUT /seller/store '{"name":"Toko Contoh","description":"Updated via API test"}' "$SELLER_TOKEN"
assert_status "PUT /seller/store" 200

api GET /seller/products "" "$SELLER_TOKEN"
assert_status "GET /seller/products" 200

api POST /seller/products '{"name":"Produk Test API","description":"dari test script","price":25000,"stock":10}' "$SELLER_TOKEN"
assert_status "POST /seller/products" 201
NEW_PRODUCT_ID=$(echo "$BODY" | jq -r '.data.id // empty')

api PUT "/seller/products/$NEW_PRODUCT_ID" '{"name":"Produk Test API Updated","description":"updated","price":30000,"stock":8}' "$SELLER_TOKEN"
assert_status "PUT /seller/products/:id" 200

api GET /seller/orders "" "$SELLER_TOKEN"
assert_status "GET /seller/orders" 200

if [[ -n "$ORDER_ID" ]]; then
  api GET "/seller/orders/$ORDER_ID" "" "$SELLER_TOKEN"
  assert_status "GET /seller/orders/:id" 200

  api POST "/seller/orders/$ORDER_ID/ready" '{}' "$SELLER_TOKEN"
  if assert_status "POST /seller/orders/:id/ready" 200; then
    READY_STATUS=$(echo "$BODY" | jq -r '.data.status // empty')
    if [[ "$READY_STATUS" == "MENUNGGU_PENGIRIM" ]]; then
      log_pass "Order marked ready → MENUNGGU_PENGIRIM"
    else
      log_fail "Order ready status unexpected: $READY_STATUS"
    fi
  fi
else
  log_skip "seller order detail & ready (no order from checkout)"
fi

api GET /seller/income "" "$SELLER_TOKEN"
assert_status "GET /seller/income" 200

api DELETE "/seller/products/$NEW_PRODUCT_ID" "" "$SELLER_TOKEN"
if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "204" ]]; then
  log_pass "DELETE /seller/products/:id (HTTP $HTTP_CODE)"
else
  log_fail "DELETE /seller/products/:id — expected 200/204, got $HTTP_CODE"
fi

# ── Driver ───────────────────────────────────────────────────────────────────
log_section "Driver"
api GET /driver/jobs "" "$DRIVER_TOKEN"
assert_status "GET /driver/jobs" 200
JOB_ID=$(echo "$BODY" | jq -r '.data.items[0].id // .data[0].id // empty')
if [[ -n "$JOB_ID" && "$JOB_ID" != "null" ]]; then
  JOB_STORE=$(echo "$BODY" | jq -r '.data.items[0].store_name // .data[0].store_name // empty')
  log_pass "Driver jobs available — job $JOB_ID (store: ${JOB_STORE:-?})"

  api POST "/driver/jobs/$JOB_ID/take" '{}' "$DRIVER_TOKEN"
  assert_status "POST /driver/jobs/:id/take" 200

  api POST "/driver/jobs/$JOB_ID/complete" '{}' "$DRIVER_TOKEN"
  assert_status "POST /driver/jobs/:id/complete" 200
else
  log_skip "driver take/complete (no available jobs — order may not be ready)"
fi

api GET /driver/jobs/history "" "$DRIVER_TOKEN"
assert_status "GET /driver/jobs/history" 200

# ── Admin ────────────────────────────────────────────────────────────────────
log_section "Admin"
api GET /admin/users "" "$ADMIN_TOKEN"
assert_status "GET /admin/users" 200

api GET /admin/stores "" "$ADMIN_TOKEN"
assert_status "GET /admin/stores" 200

api GET /admin/orders "" "$ADMIN_TOKEN"
assert_status "GET /admin/orders" 200

api POST /admin/vouchers "{\"code\":\"TESTVOUCH${RAND}\",\"discount_type\":\"PERCENT\",\"discount_value\":10,\"expiry_date\":\"2030-12-31T00:00:00Z\",\"remaining_usage\":100}" "$ADMIN_TOKEN"
if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
  log_pass "POST /admin/vouchers (HTTP $HTTP_CODE)"
else
  log_fail "POST /admin/vouchers — got $HTTP_CODE"
fi

api POST /admin/promos "{\"code\":\"TESTPROMO${RAND}\",\"discount_type\":\"PERCENT\",\"discount_value\":5,\"expiry_date\":\"2030-12-31T00:00:00Z\"}" "$ADMIN_TOKEN"
if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
  log_pass "POST /admin/promos (HTTP $HTTP_CODE)"
else
  log_fail "POST /admin/promos — got $HTTP_CODE"
fi

ADMIN_SELLER_EMAIL="newseller${RAND}@test.local"
api POST /admin/sellers "{\"username\":\"newseller${RAND}\",\"email\":\"$ADMIN_SELLER_EMAIL\",\"password\":\"seller123\",\"store_name\":\"Toko Baru API ${RAND}\",\"description\":\"from test\"}" "$ADMIN_TOKEN"
assert_status "POST /admin/sellers" 201

NEW_SELLER_ID=$(echo "$BODY" | jq -r '.data.user.id // empty')
api POST /admin/stores "{\"seller_user_id\":\"$NEW_SELLER_ID\",\"name\":\"Toko Admin API\",\"description\":\"test\"}" "$ADMIN_TOKEN"
if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
  log_pass "POST /admin/stores (HTTP $HTTP_CODE)"
else
  log_skip "POST /admin/stores (seller may already have store)"
fi

api POST /admin/advance-day '{}' "$ADMIN_TOKEN"
assert_status "POST /admin/advance-day" 200

# ── Reviews (public create) ──────────────────────────────────────────────────
log_section "Reviews"
api POST /reviews '{"reviewer_name":"API Tester","rating":5,"comment":"Bagus dari API test"}' ""
if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
  log_pass "POST /reviews (HTTP $HTTP_CODE)"
else
  log_fail "POST /reviews — got $HTTP_CODE"
fi

# ── Role guard ───────────────────────────────────────────────────────────────
log_section "Role Guards"
api GET /buyer/wallet "" "$SELLER_TOKEN"
if [[ "$HTTP_CODE" == "403" ]]; then
  log_pass "Seller blocked from buyer/wallet (403)"
else
  log_fail "Seller should be blocked from buyer/wallet, got HTTP $HTTP_CODE"
fi

api GET /seller/store "" "$BUYER_TOKEN"
if [[ "$HTTP_CODE" == "403" ]]; then
  log_pass "Buyer blocked from seller/store (403)"
else
  log_fail "Buyer should be blocked from seller/store, got HTTP $HTTP_CODE"
fi

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}, ${YELLOW}$SKIP skipped${NC}"
if (( FAIL > 0 )); then
  echo ""
  echo "Failures:"
  for f in "${FAILURES[@]}"; do echo "  - $f"; done
  exit 1
fi
echo -e "${GREEN}All tests passed!${NC}"
exit 0
