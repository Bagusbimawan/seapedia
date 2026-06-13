# SEAPEDIA — CLAUDE.md
# Sumber kebenaran tunggal. Baca sebelum nulis satu baris kode pun.

> **Challenge:** COMPFEST 18 Software Engineering Academy — Multi-Role Marketplace
> **Poin:** 100 pts core (7 levels) + 25 pts bonus
> **Go module:** `github.com/bagus/seapedia`

---

## 1. TECH STACK

### Backend
| Komponen | Library | Versi |
|---|---|---|
| Framework | `github.com/gofiber/fiber/v2` | v2.52.4 |
| ORM | `gorm.io/gorm` + `gorm.io/driver/postgres` | v1.25.10 / v1.5.7 |
| JWT | `github.com/golang-jwt/jwt/v5` | v5.2.1 |
| Hash | `golang.org/x/crypto` (bcrypt, cost=12) | v0.23.0 |
| Validation | `github.com/go-playground/validator/v10` | v10.22.0 |
| UUID | `github.com/google/uuid` | v1.6.0 |
| XSS | `github.com/microcosm-cc/bluemonday` | v1.0.27 |
| Scheduler | `github.com/robfig/cron/v3` | v3.0.1 |
| Swagger | `github.com/swaggo/fiber-swagger` + `github.com/swaggo/swag` | v1.3.0 |
| Config | `github.com/joho/godotenv` | v1.5.1 |
| Hot reload | `air` (install: `go install github.com/air-verse/air@latest`) | latest |
| Migration | `golang-migrate` (install via brew/apt/script) | latest |

### Frontend
| Komponen | Library | Versi |
|---|---|---|
| Framework | `next` (App Router) | 15.x |
| State auth | `zustand` | v5 |
| State server | `@tanstack/react-query` | v5 |
| HTTP | `axios` | v1.7 |
| Styling | `tailwindcss` | v3 |
| Forms | `react-hook-form` + `@hookform/resolvers` + `zod` | latest |
| Cookies | `js-cookie` + `@types/js-cookie` | latest |
| Icons | `lucide-react` | latest |
| Util | `clsx` | latest |

### Infra
- PostgreSQL 16 (Docker)
- Docker Compose
---

## 2. DIRECTORY STRUCTURE

```
seapedia/
├── CLAUDE.md
├── docker-compose.yml
├── .gitignore
├── README.md
│
├── backend/
│   ├── cmd/api/main.go              ← entry point, wire semua dep
│   ├── go.mod / go.sum
│   ├── .env / .env.example
│   ├── .air.toml
│   ├── Makefile
│   ├── Dockerfile
│   ├── docs/                        ← swagger generated (jangan edit manual)
│   ├── migrations/
│   │   ├── 001_initial.up.sql
│   │   └── 001_initial.down.sql
│   ├── seed/seed.go
│   └── internal/
│       ├── config/config.go
│       ├── pkg/
│       │   ├── jwt/jwt.go
│       │   ├── hash/hash.go
│       │   ├── response/response.go
│       │   ├── apperror/errors.go
│       │   └── clock/clock.go
│       ├── domain/                  ← PURE GO, zero framework import
│       │   ├── user/{entity.go,repository.go}
│       │   ├── store/{entity.go,repository.go}
│       │   ├── product/{entity.go,repository.go}
│       │   ├── wallet/{entity.go,repository.go}
│       │   ├── address/{entity.go,repository.go}
│       │   ├── cart/{entity.go,repository.go}
│       │   ├── order/{entity.go,repository.go}
│       │   ├── discount/{entity.go,repository.go}
│       │   ├── delivery/{entity.go,repository.go}
│       │   └── review/{entity.go,repository.go}
│       ├── usecase/
│       │   ├── auth/auth_usecase.go
│       │   ├── store/store_usecase.go
│       │   ├── product/product_usecase.go
│       │   ├── wallet/wallet_usecase.go
│       │   ├── cart/cart_usecase.go
│       │   ├── checkout/checkout_usecase.go
│       │   ├── order/order_usecase.go
│       │   ├── discount/discount_usecase.go
│       │   ├── delivery/delivery_usecase.go
│       │   ├── review/review_usecase.go
│       │   ├── admin/admin_usecase.go
│       │   └── overdue/overdue_usecase.go
│       ├── repository/postgres/
│       │   ├── db.go
│       │   ├── models.go            ← SEMUA GORM struct
│       │   ├── user_repo.go
│       │   ├── store_repo.go
│       │   ├── product_repo.go
│       │   ├── wallet_repo.go
│       │   ├── address_repo.go
│       │   ├── cart_repo.go
│       │   ├── order_repo.go
│       │   ├── discount_repo.go
│       │   ├── delivery_repo.go
│       │   └── review_repo.go
│       └── delivery/http/
│           ├── router.go
│           ├── middleware/
│           │   ├── auth.go
│           │   └── role.go
│           ├── dto/
│           │   ├── auth_dto.go
│           │   ├── store_dto.go
│           │   ├── product_dto.go
│           │   ├── wallet_dto.go
│           │   ├── cart_dto.go
│           │   ├── order_dto.go
│           │   ├── discount_dto.go
│           │   ├── delivery_dto.go
│           │   ├── review_dto.go
│           │   └── admin_dto.go
│           └── handler/
│               ├── auth_handler.go
│               ├── store_handler.go
│               ├── product_handler.go
│               ├── wallet_handler.go
│               ├── cart_handler.go
│               ├── checkout_handler.go
│               ├── order_handler.go
│               ├── discount_handler.go
│               ├── delivery_handler.go
│               ├── review_handler.go
│               └── admin_handler.go
│
└── frontend/
    ├── package.json
    ├── next.config.ts
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── .env.local / .env.example
    ├── Dockerfile
    └── src/
        ├── middleware.ts
        ├── types/index.ts
        ├── stores/useAuthStore.ts
        ├── hooks/useAuth.ts
        ├── lib/api/
        │   ├── client.ts
        │   ├── auth.ts
        │   ├── products.ts
        │   ├── stores.ts
        │   ├── wallet.ts
        │   ├── cart.ts
        │   ├── orders.ts
        │   ├── discounts.ts
        │   ├── delivery.ts
        │   ├── reviews.ts
        │   └── admin.ts
        ├── components/
        │   ├── providers/QueryProvider.tsx
        │   ├── ui/{Button,Input,Card,Badge,Modal}.tsx
        │   └── layout/{Navbar,Footer}.tsx
        └── app/
            ├── layout.tsx
            ├── globals.css
            ├── page.tsx
            ├── (auth)/login/page.tsx
            ├── (auth)/register/page.tsx
            ├── role-select/page.tsx
            ├── (public)/products/page.tsx
            ├── (public)/products/[id]/page.tsx
            └── (dashboard)/{buyer,seller,driver,admin}/page.tsx
```

---

## 3. ARSITEKTUR — CLEAN ARCHITECTURE

```
HTTP Request
    │
    ▼
[Fiber Handler]     ← parse, validate DTO, call usecase, format response
    │
    ▼
[Usecase]           ← business logic, orchestration. Hanya depends ke domain interfaces.
    │
    ▼
[Domain Interface]  ← repository contract (pure Go interface)
    │
    ▼
[GORM Repository]   ← konkret implementasi
    │
    ▼
[PostgreSQL]
```

**Aturan keras:**
- `internal/domain/` → **ZERO** import dari fiber/gorm/apapun external.
- `internal/usecase/` → hanya import domain interfaces + `internal/pkg/*` + `internal/config`.
- `internal/repository/postgres/` → implementasi domain interfaces, boleh import gorm.
- `internal/delivery/http/` → hanya HTTP concern, import usecase (bukan repo langsung).

---

## 4. ADR — ARCHITECTURAL DECISION RECORDS

### ADR-001 — Active Role di JWT Claim

**Keputusan:** JWT claim = `{ user_id, active_role }`. Middleware cek `active_role`, bukan full role list.

**Login flow:**
```
Admin login → active_role = "ADMIN"

User dengan 1 role non-admin → active_role = role tersebut

User dengan ≥2 role non-admin → active_role = "PENDING"
                                 needs_role_select = true
                                 Frontend → /role-select

Switch role → POST /api/v1/auth/switch-role { "role": "SELLER" }
           → server re-issue token baru dengan active_role baru
```

**Implementasi middleware:**
```go
// middleware/auth.go — set dari JWT
c.Locals("user_id", claims.UserID)
c.Locals("active_role", claims.ActiveRole)

// middleware/role.go — guard per endpoint
func RequireRole(roles ...user.Role) fiber.Handler {
    return func(c *fiber.Ctx) error {
        active := user.Role(c.Locals("active_role").(string))
        for _, r := range roles {
            if active == r { return c.Next() }
        }
        return response.Forbidden(c, "insufficient role")
    }
}

// Di handler — ambil context
userID := c.Locals("user_id").(string)
role   := user.Role(c.Locals("active_role").(string))
```

---

### ADR-002 — Checkout Formula (urutan KRITIS)
```
subtotal      = Σ(price_snapshot × qty)     ← snapshot harga saat checkout
taxable_base  = subtotal - discount_amount  ← diskon potong SEBELUM pajak
tax_amount    = taxable_base × 0.12         ← PPN 12% dari after-discount
total         = taxable_base + tax_amount + delivery_fee
```

**Delivery fees & SLA:**
| Method   | Fee (Rp) | SLA    |
|----------|----------|--------|
| INSTANT  | 25.000   | 1 hari |
| NEXT_DAY | 15.000   | 2 hari |
| REGULAR  | 10.000   | 5 hari |

**Contoh nyata:**
```
2 item × Rp 50.000 = subtotal Rp 100.000
Voucher 20%        → discount Rp 20.000
Taxable            = Rp 80.000
PPN 12%            = Rp 9.600
Delivery NEXT_DAY  = Rp 15.000
TOTAL              = Rp 104.600
```

**⚠️ Money rule:** semua amount **`int64` Rupiah**. NEVER `float64`.

---

### ADR-003 — Single-Store Cart

- `carts.store_id` ter-lock ke store produk pertama yang masuk cart.
- Tambah produk dari store berbeda → `400 "clear cart first"`.
- Cart kosong → `store_id = NULL`.
- Enforcement di backend (bukan cuma UI).

```go
// usecase/cart — AddItem
if !cart.IsEmpty() && !cart.BelongsToStore(product.StoreID) {
    return apperror.New(400, "cart is locked to another store, please clear cart first")
}
```

---

### ADR-004 — Discount: Satu Tabel, Dua Kind

- 1 tabel `discounts`, kolom `kind = VOUCHER | PROMO`.
- **Voucher:** punya `remaining_usage`, berkurang 1 tiap dipakai.
- **Promo:** `remaining_usage = NULL`, hanya expires by date.
- Max **1 discount** per order. Tidak bisa kombinasi.
- Exposed via endpoint terpisah: `GET /vouchers` dan `GET /promos`.
- Discount dipotong dari subtotal **sebelum** PPN (ADR-002).

```go
// Dalam domain/discount/entity.go:
func (d *Discount) IsUsable(now time.Time) bool {
    if now.After(d.ExpiryDate) { return false }
    if d.Kind == KindVoucher && d.RemainingUsage != nil && *d.RemainingUsage <= 0 {
        return false
    }
    return true
}
func (d *Discount) Calculate(subtotal int64) int64 {
    if d.DiscountType == TypePercent { return subtotal * d.DiscountValue / 100 }
    if d.DiscountValue > subtotal { return subtotal }
    return d.DiscountValue
}
```

---

### ADR-005 — Order Status Machine

```
SEDANG_DIKEMAS
    │  seller: POST /seller/orders/:id/ready
    ▼
MENUNGGU_PENGIRIM
    │  driver: POST /driver/jobs/:id/take
    ▼
SEDANG_DIKIRIM
    │  driver: POST /driver/jobs/:id/complete
    ▼
PESANAN_SELESAI  ──── terminal (final state normal)

Dari state manapun yang belum terminal:
    DIKEMBALIKAN ──── terminal (overdue handler)
```

**Setiap transisi harus:**
1. Validasi `current.CanTransitionTo(next)` di usecase.
2. `UPDATE orders SET status = ?`
3. INSERT ke `order_status_history`.
4. Trigger efek samping (income, wallet, dll).

```go
// domain/order/entity.go
func (s Status) CanTransitionTo(next Status) bool {
    valid := map[Status]Status{
        StatusSedangDikemas:    StatusMenungguPengirim,
        StatusMenungguPengirim: StatusSedangDikirim,
        StatusSedangDikirim:    StatusPesananSelesai,
    }
    return valid[s] == next
}
```

---

### ADR-006 — Virtual Clock untuk Overdue Simulation

- `pkg/clock.Now()` = `time.Now() + offset`.
- Offset disimpan di tabel `system_clock` (single row, id=1).
- `POST /admin/advance-day` → offset += 24h, update DB, sync ke `pkg/clock`.
- Cron job setiap menit: cek `orders WHERE NOT terminal AND deadline_at < clock.Now()`.

**Overdue action per order (dalam 1 DB transaction, idempotent):**
```
1. Re-fetch order + cek !status.IsTerminal() → skip kalau sudah
2. UpdateStatus → DIKEMBALIKAN
3. INSERT order_status_history
4. Refund buyer wallet (type=REFUND, amount=order.total)
5. INSERT seller_income (type=REVERSAL, amount=previous_income)
6. RestoreStock semua order_items (atomic +qty)
7. COMMIT
```

---

### ADR-007 — Atomic Stock Decrement

```go
// WAJIB pakai raw exec untuk atomic check-and-decrement:
result := db.WithContext(ctx).Exec(
    "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
    qty, productID, qty,
)
if result.RowsAffected == 0 {
    return apperror.New(400, "stok tidak cukup: " + productID)
}
```
Tidak perlu SELECT dulu, tidak perlu lock manual. Atomic by nature.

---

### ADR-008 — Security (Level 7)

| Ancaman | Mitigasi |
|---------|----------|
| SQL Injection | GORM parameterized queries. JANGAN `db.Raw("... " + userInput)`. |
| XSS | `bluemonday.StrictPolicy().Sanitize(comment)` sebelum simpan review. |
| Invalid input | `go-playground/validator` di semua request struct DTO. |
| JWT bypass | Validasi signature + expiry di setiap endpoint protected. |
| CORS | `CORS_ORIGINS` dari env, tidak hardcode `*`. |
| Password | bcrypt cost=12. |

---

## 5. DATABASE SCHEMA — 17 TABEL

### Relasi singkat
```
users ──< user_roles (1 user banyak role)
users ──o stores (1 seller 1 store)
users ──o wallets (1 user 1 wallet)
users ──o carts (1 buyer 1 cart)
users ──< addresses
users ──< orders (sebagai buyer)
users ──< delivery_jobs (sebagai driver)
users ──< app_reviews
stores ──< products
stores ──< orders
stores ──< seller_incomes
wallets ──< wallet_transactions
carts ──< cart_items >── products
orders ──< order_items >── products
orders ──< order_status_history
orders ──o delivery_jobs (UNIQUE per order)
orders >──o discounts
seller_incomes >── orders
```

### DDL Lengkap (migrations/001_initial.up.sql)

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username      VARCHAR(100) UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    phone         VARCHAR(20),
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_roles (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role    VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN','SELLER','BUYER','DRIVER')),
    UNIQUE(user_id, role)
);

CREATE TABLE addresses (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label      VARCHAR(100) NOT NULL,
    street     TEXT NOT NULL,
    city       VARCHAR(100) NOT NULL,
    zip_code   VARCHAR(10) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_addresses_user_id ON addresses(user_id);

CREATE TABLE stores (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_user_id UUID UNIQUE NOT NULL REFERENCES users(id),
    name           VARCHAR(200) UNIQUE NOT NULL,
    description    TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id    UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    price       BIGINT NOT NULL CHECK (price >= 0),
    stock       INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_products_store_id ON products(store_id);

CREATE TABLE wallets (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID UNIQUE NOT NULL REFERENCES users(id),
    balance    BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE wallet_transactions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id     UUID NOT NULL REFERENCES wallets(id),
    type          VARCHAR(20) NOT NULL CHECK (type IN ('TOPUP','PAYMENT','REFUND')),
    amount        BIGINT NOT NULL,
    balance_after BIGINT NOT NULL,
    ref_order_id  UUID,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_wallet_tx_wallet_id ON wallet_transactions(wallet_id);

CREATE TABLE carts (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID UNIQUE NOT NULL REFERENCES users(id),
    store_id   UUID REFERENCES stores(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cart_items (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id    UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity   INT NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(cart_id, product_id)
);

CREATE TABLE discounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(50) UNIQUE NOT NULL,
    kind            VARCHAR(20) NOT NULL CHECK (kind IN ('VOUCHER','PROMO')),
    discount_type   VARCHAR(20) NOT NULL CHECK (discount_type IN ('PERCENT','FIXED')),
    discount_value  BIGINT NOT NULL CHECK (discount_value > 0),
    expiry_date     TIMESTAMPTZ NOT NULL,
    remaining_usage INT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_discounts_kind ON discounts(kind);

CREATE TABLE orders (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_user_id    UUID NOT NULL REFERENCES users(id),
    store_id         UUID NOT NULL REFERENCES stores(id),
    discount_id      UUID REFERENCES discounts(id),
    address_snapshot JSONB NOT NULL,
    delivery_method  VARCHAR(20) NOT NULL CHECK (delivery_method IN ('INSTANT','NEXT_DAY','REGULAR')),
    subtotal         BIGINT NOT NULL,
    discount_amount  BIGINT NOT NULL DEFAULT 0,
    tax_amount       BIGINT NOT NULL,
    delivery_fee     BIGINT NOT NULL,
    total            BIGINT NOT NULL,
    status           VARCHAR(30) NOT NULL DEFAULT 'SEDANG_DIKEMAS',
    deadline_at      TIMESTAMPTZ NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (status IN ('SEDANG_DIKEMAS','MENUNGGU_PENGIRIM','SEDANG_DIKIRIM','PESANAN_SELESAI','DIKEMBALIKAN'))
);
CREATE INDEX idx_orders_buyer    ON orders(buyer_user_id);
CREATE INDEX idx_orders_store    ON orders(store_id);
CREATE INDEX idx_orders_status   ON orders(status);
CREATE INDEX idx_orders_deadline ON orders(deadline_at);

CREATE TABLE order_items (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id       UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id     UUID NOT NULL REFERENCES products(id),
    name_snapshot  VARCHAR(255) NOT NULL,
    price_snapshot BIGINT NOT NULL,
    quantity       INT NOT NULL CHECK (quantity > 0)
);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

CREATE TABLE order_status_history (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status     VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_order_history_order ON order_status_history(order_id);

CREATE TABLE delivery_jobs (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id       UUID UNIQUE NOT NULL REFERENCES orders(id),
    driver_user_id UUID REFERENCES users(id),
    earning_amount BIGINT NOT NULL DEFAULT 0,
    taken_at       TIMESTAMPTZ,
    completed_at   TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_delivery_driver ON delivery_jobs(driver_user_id);

CREATE TABLE seller_incomes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id   UUID NOT NULL REFERENCES stores(id),
    order_id   UUID NOT NULL REFERENCES orders(id),
    type       VARCHAR(20) NOT NULL CHECK (type IN ('INCOME','REVERSAL')),
    amount     BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_seller_incomes_store ON seller_incomes(store_id);

CREATE TABLE app_reviews (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_name VARCHAR(100) NOT NULL,
    rating        INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment       TEXT NOT NULL,
    user_id       UUID REFERENCES users(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE system_clock (
    id           INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    offset_hours BIGINT NOT NULL DEFAULT 0,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO system_clock (id, offset_hours) VALUES (1, 0);
```

---

## 6. API ENDPOINTS LENGKAP

Base: `/api/v1`

### Auth & Public
```
POST   /auth/register                     ← L1
POST   /auth/login                        ← L1
POST   /auth/switch-role       [JWT]      ← L1
GET    /auth/me                [JWT]      ← L1

GET    /products               public     ← L2 ?search=&page=&limit=
GET    /products/:id           public     ← L2
GET    /stores/:id             public     ← L2

GET    /vouchers               public     ← L4
GET    /promos                 public     ← L4

GET    /reviews                public     ← L1 ?page=&limit=
POST   /reviews                public     ← L1

GET    /swagger/*                         ← always
```

### Seller [JWT, role=SELLER]
```
GET    /seller/store                      ← L2
POST   /seller/store                      ← L2
PUT    /seller/store                      ← L2

GET    /seller/products        ?page=     ← L2
POST   /seller/products                   ← L2
PUT    /seller/products/:id               ← L2
DELETE /seller/products/:id               ← L2

GET    /seller/orders          ?status=&page=  ← L3
GET    /seller/orders/:id                 ← L3
POST   /seller/orders/:id/ready           ← L4 → MENUNGGU_PENGIRIM

GET    /seller/income          ?page=     ← L4
```

### Buyer [JWT, role=BUYER]
```
GET    /buyer/wallet                      ← L3
POST   /buyer/wallet/topup                ← L3 { amount: int64 }
GET    /buyer/wallet/transactions ?page=  ← L3

GET    /buyer/addresses                   ← L3
POST   /buyer/addresses                   ← L3
PUT    /buyer/addresses/:id               ← L3
DELETE /buyer/addresses/:id               ← L3
POST   /buyer/addresses/:id/set-default   ← L3

GET    /buyer/cart                        ← L3
POST   /buyer/cart/items                  ← L3 { product_id, quantity }
PUT    /buyer/cart/items/:productId       ← L3 { quantity }
DELETE /buyer/cart/items/:productId       ← L3
DELETE /buyer/cart                        ← L3 clear all

POST   /buyer/checkout                    ← L3
GET    /buyer/orders           ?page=     ← L3
GET    /buyer/orders/:id                  ← L3

POST   /buyer/discount/validate           ← L4 { code: string }
```

### Driver [JWT, role=DRIVER]
```
GET    /driver/jobs            ?page=     ← L5 available jobs
POST   /driver/jobs/:id/take              ← L5
POST   /driver/jobs/:id/complete          ← L5
GET    /driver/jobs/history    ?page=     ← L5
```

### Admin [JWT, role=ADMIN]
```
GET    /admin/users            ?page=     ← L6
GET    /admin/stores           ?page=     ← L6
GET    /admin/orders           ?status=&page=  ← L6
POST   /admin/vouchers                    ← L4
POST   /admin/promos                      ← L4
POST   /admin/advance-day                 ← L6 virtual clock +1 day
```

---

## 7. REQUEST / RESPONSE FORMAT

### Standard Response
```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": "pesan error" }

// Paginated
{
  "success": true,
  "data": { "items": [...], "total": 100, "page": 1, "limit": 10 }
}
```

### Key Request Bodies

**Register:**
```json
{ "username": "string", "email": "email", "phone": "string?",
  "password": "min8", "roles": ["SELLER"] }
```

**Login response:**
```json
{ "token": "eyJ...", "user": { "id","username","email","phone","roles" },
  "active_role": "BUYER", "needs_role_select": false }
```

**Checkout:**
```json
{
  "address_id": "uuid",
  "delivery_method": "INSTANT|NEXT_DAY|REGULAR",
  "discount_code": "VOUCHER123"   // optional
}
```

**Create Product:**
```json
{ "name": "string", "description": "string?", "price": 50000, "stock": 10 }
```

**Topup:**
```json
{ "amount": 100000 }
```

**Add to Cart:**
```json
{ "product_id": "uuid", "quantity": 2 }
```

**Voucher (admin create):**
```json
{
  "code": "DISC20", "discount_type": "PERCENT", "discount_value": 20,
  "expiry_date": "2025-12-31T23:59:59Z", "remaining_usage": 100
}
```

---

## 8. BUSINESS LOGIC DETAIL

### Checkout Flow (usecase/checkout)
```
1. Validate cart tidak kosong
2. Validate semua products masih ada dan punya stock
3. Validate address milik buyer
4. Jika ada discount_code:
   - FindByCode → IsUsable(clock.Now()) → error kalau tidak usable
   - discount_amount = Discount.Calculate(subtotal)
5. Hitung total via ADR-002 formula
6. Mulai DB Transaction:
   a. AtomicDecrementStock tiap product (ADR-007) → rollback kalau gagal
   b. Debit buyer wallet amount=total → error kalau balance kurang
   c. Create order + order_items (dengan snapshot)
   d. INSERT order_status_history (SEDANG_DIKEMAS)
   e. Create delivery_job (earning_amount = delivery_fee × 0.80)
   f. Jika voucher: DecrementUsage
7. Clear cart setelah checkout
8. Commit → return order
```

### Seller Ready Order (MENUNGGU_PENGIRIM)
```
1. Verify order.store_id == seller's store
2. Validate order.status == SEDANG_DIKEMAS
3. UpdateStatus → MENUNGGU_PENGIRIM
4. INSERT order_status_history
5. INSERT seller_incomes (type=INCOME, amount = order.total - order.delivery_fee)
```

### Driver Take Job (atomic)
```
UPDATE delivery_jobs
SET driver_user_id = $driverID, taken_at = NOW()
WHERE id = $jobID AND driver_user_id IS NULL

→ RowsAffected = 0 → 409 "job already taken"
→ UpdateStatus order → SEDANG_DIKIRIM
→ INSERT order_status_history
```

### Driver Complete Delivery
```
1. Verify job.driver_user_id == current driver
2. UPDATE delivery_jobs SET completed_at = NOW()
3. UpdateStatus order → PESANAN_SELESAI
4. INSERT order_status_history
5. Credit driver wallet (type=REFUND, amount=earning_amount)
   ← driver credit dianggap "return of service fee"
```

### Overdue Cron (setiap menit)
```go
// usecase/overdue
orders := repo.FindOverdue(ctx, clock.Now())
for _, order := range orders {
    db.Transaction(func(tx) error {
        fresh := repo.FindByID(ctx, order.ID)  // re-fetch
        if fresh.Status.IsTerminal() { return nil }  // idempotency

        repo.UpdateStatus(ctx, order.ID, StatusDikembalikan)
        repo.AddStatusHistory(...)
        walletRepo.Credit(ctx, buyerWalletID, order.Total, TxRefund, &order.ID)
        sellerIncomeRepo.Insert(type=REVERSAL, amount=previousIncome)
        for _, item := range order.Items {
            productRepo.RestoreStock(ctx, item.ProductID, item.Quantity)
        }
        return nil
    })
}
```

### Seller Income Calculation
```
seller_income = order.total - order.delivery_fee
// Seller dapat amount setelah delivery fee dikurangi
// Driver dapat delivery_fee × 80% = earning_amount (sudah tersimpan di delivery_jobs)
// Platform "dapat" 20% delivery fee sisanya (tidak diimplementasi kecuali bonus)
```

---

## 9. CODE PATTERNS WAJIB

### Error Handling (semua handler)
```go
func handleErr(c *fiber.Ctx, err error) error {
    var e *apperror.AppError
    if errors.As(err, &e) {
        switch e.Code {
        case 400: return response.BadRequest(c, e.Message)
        case 401: return response.Unauthorized(c, e.Message)
        case 403: return response.Forbidden(c, e.Message)
        case 404: return response.NotFound(c, e.Message)
        case 409: return response.Conflict(c, e.Message)
        case 422: return response.Unprocessable(c, e.Message)
        }
    }
    log.Printf("internal error: %v", err)
    return response.Internal(c)
}
```

### Pagination (semua list endpoint)
```go
page  := max(c.QueryInt("page", 1), 1)
limit := c.QueryInt("limit", 10)
if limit > 100 { limit = 100 }
offset := (page - 1) * limit
```

### Validation DTO
```go
type CreateProductReq struct {
    Name        string `json:"name" validate:"required,min=2,max=255"`
    Description string `json:"description" validate:"omitempty,max=2000"`
    Price       int64  `json:"price" validate:"required,min=1"`
    Stock       int    `json:"stock" validate:"required,min=0"`
}
// Di handler:
var req CreateProductReq
if err := c.BodyParser(&req); err != nil { return response.BadRequest(c, "invalid body") }
if err := validate.Struct(&req); err != nil { return response.Unprocessable(c, err.Error()) }
```

### Bluemonday (review comment)
```go
import "github.com/microcosm-cc/bluemonday"
p := bluemonday.StrictPolicy()
comment = p.Sanitize(req.Comment) // sebelum insert
```

### UUID
```go
import "github.com/google/uuid"
id := uuid.New().String()
```

### Swagger Annotation (semua handler)
```go
// CreateProduct godoc
// @Summary Create a new product
// @Tags seller,products
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body dto.CreateProductReq true "Product data"
// @Success 201 {object} response.R{data=dto.ProductResponse}
// @Router /seller/products [post]
func (h *ProductHandler) Create(c *fiber.Ctx) error { ... }
```

---

## 10. ENVIRONMENT VARIABLES

### backend/.env
```env
PORT=8080
ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=seapedia
DB_PASSWORD=seapedia123
DB_NAME=seapedia_db
DB_SSLMODE=disable
JWT_SECRET=min-32-random-chars-change-in-production!!
JWT_EXPIRY=24h
CORS_ORIGINS=http://localhost:3000
```

### frontend/.env.local
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

---

## 11. MAKEFILE

```makefile
include .env
export

.PHONY: dev build migrate-up migrate-down seed swagger test tidy

dev:
	air -c .air.toml

build:
	go build -o ./bin/api ./cmd/api

migrate-up:
	migrate -path ./migrations \
	  -database "postgres://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=$(DB_SSLMODE)" up

migrate-down:
	migrate -path ./migrations \
	  -database "postgres://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=$(DB_SSLMODE)" down 1

seed:
	go run ./seed/seed.go

swagger:
	swag init -g ./cmd/api/main.go -o ./docs

test:
	go test ./... -v -cover

tidy:
	go mod tidy
```

---

## 12. DEMO ACCOUNTS (wajib di-seed)

| Email | Password | Role | Extra |
|-------|----------|------|-------|
| admin@seapedia.com | admin123 | ADMIN | — |
| seller@seapedia.com | seller123 | SELLER | Buat store "Toko Contoh" + 3 products |
| buyer@seapedia.com | buyer123 | BUYER | Wallet balance Rp 500.000 |
| driver@seapedia.com | driver123 | DRIVER | — |
| multi@seapedia.com | multi123 | SELLER+BUYER+DRIVER | Trigger needs_role_select |

---

## 13. FRONTEND AUTH FLOW

### Zustand Store
```typescript
// stores/useAuthStore.ts
interface AuthState {
  token: string | null
  user: User | null
  activeRole: Role | null
  isAuthenticated: boolean
  setAuth(token: string, user: User, activeRole: Role): void
  setActiveRole(token: string, role: Role): void
  clearAuth(): void
}
// persist ke localStorage key 'seapedia-auth'
```

### Login Flow
```
POST /auth/login
  ├── needs_role_select=false
  │     → setAuth() → set cookie → redirect /{activeRole.toLowerCase()}
  └── needs_role_select=true
        → setAuth(PENDING) → set cookie(PENDING) → redirect /role-select

POST /auth/switch-role { role }
  → setActiveRole() → update cookie → redirect /{role.toLowerCase()}
```

### Cookies (Next.js middleware baca ini)
```typescript
Cookies.set('seapedia-token', token, { expires: 1 })
Cookies.set('seapedia-role', activeRole, { expires: 1 })
// Logout:
Cookies.remove('seapedia-token')
Cookies.remove('seapedia-role')
```

### Next.js Middleware Logic
```typescript
// src/middleware.ts
const PROTECTED = ['/buyer', '/seller', '/driver', '/admin', '/role-select']
const AUTH_ONLY = ['/login', '/register']

// No token + protected → redirect /login
// Has token + auth page → redirect ke dashboard
// Token ada tapi role=PENDING + bukan /role-select → redirect /role-select
```

### Axios Interceptor
```typescript
// Request: Authorization: Bearer {token} dari Zustand
// Response 401: clearAuth() + redirect /login
```

### Route Dashboard per Role
```
/buyer/*  → layout buyer (wallet, cart, orders)
/seller/* → layout seller (store, products, orders, income)
/driver/* → layout driver (available jobs, history)
/admin/*  → layout admin (users, orders, monitoring)
```

---

## 14. DOCKER COMPOSE

```yaml
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: seapedia
      POSTGRES_PASSWORD: seapedia123
      POSTGRES_DB: seapedia_db
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U seapedia -d seapedia_db"]
      interval: 5s
      retries: 5

  backend:
    build: { context: ./backend }
    ports: ["8080:8080"]
    env_file: ./backend/.env
    depends_on:
      postgres: { condition: service_healthy }

  frontend:
    build: { context: ./frontend }
    ports: ["3000:3000"]
    env_file: ./frontend/.env.local
    depends_on: [backend]

volumes:
  pgdata:
```

---

## 15. LEVEL CHECKLIST

### L1 — Auth + Public + Reviews (20 pts)
- [ ] POST /auth/register — validasi no ADMIN self-assign
- [ ] POST /auth/login — PENDING flow multi-role
- [ ] POST /auth/switch-role [JWT]
- [ ] GET /auth/me [JWT]
- [ ] GET /products (public, tanpa auth)
- [ ] GET /products/:id
- [ ] GET /reviews + POST /reviews (bluemonday sanitize)
- [ ] FE: login, register, role-select, landing, products listing

### L2 — Seller (15 pts)
- [ ] POST /seller/store (1 store per seller)
- [ ] GET + PUT /seller/store
- [ ] CRUD /seller/products
- [ ] GET /stores/:id (public)
- [ ] FE: seller dashboard, store form, product CRUD

### L3 — Buyer Wallet + Cart + Checkout (20 pts)
- [ ] Wallet: topup, balance, history
- [ ] Addresses: CRUD + set-default
- [ ] Cart: add/update/remove + single-store enforcement (ADR-003)
- [ ] POST /buyer/checkout (full formula ADR-002 + atomic stock ADR-007)
- [ ] GET /buyer/orders + /seller/orders (masing-masing dari sisi mereka)
- [ ] FE: wallet page, cart page, checkout form, order history

### L4 — Discount + Order Processing (15 pts)
- [ ] POST /admin/vouchers + /admin/promos
- [ ] GET /vouchers + /promos (public)
- [ ] Validate discount di checkout (IsUsable + Calculate)
- [ ] POST /seller/orders/:id/ready → seller income
- [ ] FE: discount code input di checkout, seller order management

### L5 — Delivery (10 pts)
- [ ] GET /driver/jobs (available = driver_user_id IS NULL)
- [ ] POST /driver/jobs/:id/take (atomic ADR-007 style)
- [ ] POST /driver/jobs/:id/complete → credit driver wallet
- [ ] Order status machine complete (→ PESANAN_SELESAI)
- [ ] FE: driver dashboard, job list, take/complete actions

### L6 — Admin + Overdue (10 pts)
- [ ] GET /admin/users, /stores, /orders
- [ ] POST /admin/advance-day → virtual clock + overdue trigger
- [ ] Cron overdue: DIKEMBALIKAN + refund + reversal + restore stock
- [ ] Idempotency (tidak double-process)
- [ ] FE: admin dashboard monitoring

### L7 — Security (10 pts)
- [ ] GORM parameterized (tidak ada raw string interpolation)
- [ ] bluemonday review sanitize
- [ ] validator di semua DTO
- [ ] JWT signature + expiry check
- [ ] CORS dari env
- [ ] Swagger docs lengkap di semua endpoint

---

## 16. KONVENSI PENTING

| Hal | Aturan |
|-----|--------|
| Money | `int64` Rupiah. NEVER `float64`. |
| UUID | `uuid.New().String()` di application layer. |
| Error | Return `*apperror.AppError` dari usecase. Handler yang convert ke HTTP. |
| Context | Semua repo method terima `context.Context` sebagai param pertama. |
| Pagination | Default limit=10, max=100. Offset = (page-1) × limit. |
| Timestamp DB | `TIMESTAMPTZ`. Go: `time.Time`. JSON ke FE: ISO string. |
| JSON field | `snake_case` di semua response. |
| Swagger | Annotate SEMUA handler sebelum submit. |
| Import order | stdlib → external → internal (gofmt standard). |
| Error handling | Jangan silent `err != nil`. Selalu handle atau return. |
