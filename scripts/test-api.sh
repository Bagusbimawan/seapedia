#!/bin/bash
# SEAPEDIA API integration test script
set -e
BASE="http://localhost:8080/api/v1"
PASS=0
FAIL=0

check() {
  local name="$1"
  local expected="$2"
  local actual="$3"
  if echo "$actual" | grep -q "$expected"; then
    echo "✅ $name"
    PASS=$((PASS+1))
  else
    echo "❌ $name"
    echo "   Expected pattern: $expected"
    echo "   Got: $actual"
    FAIL=$((FAIL+1))
  fi
}

echo "=== SEAPEDIA API Tests ==="

# Public
PRODUCTS=$(curl -s "$BASE/products")
check "GET /products" '"success":true' "$PRODUCTS"
PRODUCT_ID=$(echo "$PRODUCTS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['items'][0]['id'])" 2>/dev/null || echo "")
if [ -n "$PRODUCT_ID" ]; then
  check "GET /products/:id" '"success":true' "$(curl -s "$BASE/products/$PRODUCT_ID")"
  STORE_ID=$(curl -s "$BASE/products/$PRODUCT_ID" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['store_id'])")
  check "GET /stores/:id" '"success":true' "$(curl -s "$BASE/stores/$STORE_ID")"
fi
check "GET /vouchers" '"success":true' "$(curl -s "$BASE/vouchers")"
check "GET /promos" '"success":true' "$(curl -s "$BASE/promos")"
check "POST /reviews" '"success":true' "$(curl -s -X POST "$BASE/reviews" -H 'Content-Type: application/json' -d '{"reviewer_name":"Tester","rating":5,"comment":"Bagus sekali!"}')"
check "GET /reviews" '"success":true' "$(curl -s "$BASE/reviews")"

# Auth
LOGIN_BUYER=$(curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d '{"email":"buyer@seapedia.com","password":"buyer123"}')
check "POST /auth/login buyer" '"success":true' "$LOGIN_BUYER"
BUYER_TOKEN=$(echo "$LOGIN_BUYER" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

LOGIN_SELLER=$(curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d '{"email":"seller@seapedia.com","password":"seller123"}')
SELLER_TOKEN=$(echo "$LOGIN_SELLER" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

LOGIN_DRIVER=$(curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d '{"email":"driver@seapedia.com","password":"driver123"}')
DRIVER_TOKEN=$(echo "$LOGIN_DRIVER" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

LOGIN_ADMIN=$(curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d '{"email":"admin@seapedia.com","password":"admin123"}')
ADMIN_TOKEN=$(echo "$LOGIN_ADMIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

LOGIN_MULTI=$(curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d '{"email":"multi@seapedia.com","password":"multi123"}')
check "POST /auth/login multi-role" '"needs_role_select":true' "$LOGIN_MULTI"
MULTI_TOKEN=$(echo "$LOGIN_MULTI" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")
SWITCH=$(curl -s -X POST "$BASE/auth/switch-role" -H "Authorization: Bearer $MULTI_TOKEN" -H 'Content-Type: application/json' -d '{"role":"BUYER"}')
check "POST /auth/switch-role" '"success":true' "$SWITCH"

check "GET /auth/me" '"success":true' "$(curl -s "$BASE/auth/me" -H "Authorization: Bearer $BUYER_TOKEN")"

# Buyer
check "GET /buyer/wallet" '"success":true' "$(curl -s "$BASE/buyer/wallet" -H "Authorization: Bearer $BUYER_TOKEN")"
check "POST /buyer/wallet/topup" '"success":true' "$(curl -s -X POST "$BASE/buyer/wallet/topup" -H "Authorization: Bearer $BUYER_TOKEN" -H 'Content-Type: application/json' -d '{"amount":50000}')"
check "GET /buyer/wallet/transactions" '"success":true' "$(curl -s "$BASE/buyer/wallet/transactions" -H "Authorization: Bearer $BUYER_TOKEN")"

ADDR=$(curl -s -X POST "$BASE/buyer/addresses" -H "Authorization: Bearer $BUYER_TOKEN" -H 'Content-Type: application/json' -d '{"label":"Rumah","street":"Jl. Test 1","city":"Jakarta","zip_code":"12345","is_default":true}')
check "POST /buyer/addresses" '"success":true' "$ADDR"
ADDR_ID=$(echo "$ADDR" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
check "GET /buyer/addresses" '"success":true' "$(curl -s "$BASE/buyer/addresses" -H "Authorization: Bearer $BUYER_TOKEN")"
check "PUT /buyer/addresses/:id" '"success":true' "$(curl -s -X PUT "$BASE/buyer/addresses/$ADDR_ID" -H "Authorization: Bearer $BUYER_TOKEN" -H 'Content-Type: application/json' -d '{"label":"Rumah","street":"Jl. Test Updated","city":"Jakarta","zip_code":"12345"}')"
check "POST /buyer/addresses/:id/set-default" '"success":true' "$(curl -s -X POST "$BASE/buyer/addresses/$ADDR_ID/set-default" -H "Authorization: Bearer $BUYER_TOKEN")"

check "GET /buyer/cart" '"success":true' "$(curl -s "$BASE/buyer/cart" -H "Authorization: Bearer $BUYER_TOKEN")"
CART_BODY=$(python3 -c "import json; print(json.dumps({'product_id':'$PRODUCT_ID','quantity':2}))")
check "POST /buyer/cart/items" '"success":true' "$(curl -s -X POST "$BASE/buyer/cart/items" -H "Authorization: Bearer $BUYER_TOKEN" -H 'Content-Type: application/json' -d "$CART_BODY")"
check "PUT /buyer/cart/items/:id" '"success":true' "$(curl -s -X PUT "$BASE/buyer/cart/items/$PRODUCT_ID" -H "Authorization: Bearer $BUYER_TOKEN" -H 'Content-Type: application/json' -d '{"quantity":1}')"
check "POST /buyer/discount/validate" '"success":true' "$(curl -s -X POST "$BASE/buyer/discount/validate" -H "Authorization: Bearer $BUYER_TOKEN" -H 'Content-Type: application/json' -d '{"code":"DISC20","subtotal":100000}')"

CHECKOUT=$(curl -s -X POST "$BASE/buyer/checkout" -H "Authorization: Bearer $BUYER_TOKEN" -H 'Content-Type: application/json' -d "{\"address_id\":\"$ADDR_ID\",\"delivery_method\":\"NEXT_DAY\",\"discount_code\":\"DISC20\"}")
check "POST /buyer/checkout" '"success":true' "$CHECKOUT"
ORDER_ID=$(echo "$CHECKOUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")

check "GET /buyer/orders" '"success":true' "$(curl -s "$BASE/buyer/orders" -H "Authorization: Bearer $BUYER_TOKEN")"
check "GET /buyer/orders/:id" '"success":true' "$(curl -s "$BASE/buyer/orders/$ORDER_ID" -H "Authorization: Bearer $BUYER_TOKEN")"

# Seller
check "GET /seller/store" '"success":true' "$(curl -s "$BASE/seller/store" -H "Authorization: Bearer $SELLER_TOKEN")"
check "GET /seller/products" '"success":true' "$(curl -s "$BASE/seller/products" -H "Authorization: Bearer $SELLER_TOKEN")"
check "GET /seller/orders" '"success":true' "$(curl -s "$BASE/seller/orders" -H "Authorization: Bearer $SELLER_TOKEN")"
check "GET /seller/orders/:id" '"success":true' "$(curl -s "$BASE/seller/orders/$ORDER_ID" -H "Authorization: Bearer $SELLER_TOKEN")"
check "POST /seller/orders/:id/ready" '"success":true' "$(curl -s -X POST "$BASE/seller/orders/$ORDER_ID/ready" -H "Authorization: Bearer $SELLER_TOKEN")"
check "GET /seller/income" '"success":true' "$(curl -s "$BASE/seller/income" -H "Authorization: Bearer $SELLER_TOKEN")"

# Driver
JOBS=$(curl -s "$BASE/driver/jobs" -H "Authorization: Bearer $DRIVER_TOKEN")
check "GET /driver/jobs" '"success":true' "$JOBS"
JOB_ID=$(echo "$JOBS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['items'][0]['id'])" 2>/dev/null || echo "")
if [ -n "$JOB_ID" ]; then
  check "POST /driver/jobs/:id/take" '"success":true' "$(curl -s -X POST "$BASE/driver/jobs/$JOB_ID/take" -H "Authorization: Bearer $DRIVER_TOKEN")"
  check "POST /driver/jobs/:id/complete" '"success":true' "$(curl -s -X POST "$BASE/driver/jobs/$JOB_ID/complete" -H "Authorization: Bearer $DRIVER_TOKEN")"
fi
check "GET /driver/jobs/history" '"success":true' "$(curl -s "$BASE/driver/jobs/history" -H "Authorization: Bearer $DRIVER_TOKEN")"

# Admin
check "GET /admin/users" '"success":true' "$(curl -s "$BASE/admin/users" -H "Authorization: Bearer $ADMIN_TOKEN")"
check "GET /admin/stores" '"success":true' "$(curl -s "$BASE/admin/stores" -H "Authorization: Bearer $ADMIN_TOKEN")"
check "GET /admin/orders" '"success":true' "$(curl -s "$BASE/admin/orders" -H "Authorization: Bearer $ADMIN_TOKEN")"
TS=$(date +%s)
VOUCHER_BODY=$(python3 -c "import json; print(json.dumps({'code':'V$TS','discount_type':'PERCENT','discount_value':10,'expiry_date':'2027-12-31T23:59:59Z','remaining_usage':50}))")
PROMO_BODY=$(python3 -c "import json; print(json.dumps({'code':'P$TS','discount_type':'FIXED','discount_value':5000,'expiry_date':'2027-12-31T23:59:59Z'}))")
check "POST /admin/vouchers" '"success":true' "$(curl -s -X POST "$BASE/admin/vouchers" -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' -d "$VOUCHER_BODY")"
check "POST /admin/promos" '"success":true' "$(curl -s -X POST "$BASE/admin/promos" -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' -d "$PROMO_BODY")"
check "POST /admin/advance-day" '"success":true' "$(curl -s -X POST "$BASE/admin/advance-day" -H "Authorization: Bearer $ADMIN_TOKEN")"

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
