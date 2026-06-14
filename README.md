# SEAPEDIA

Multi-role marketplace untuk COMPFEST 18 Software Engineering Academy — **Admin, Seller, Buyer, Driver**.

**Stack:** Go Fiber + GORM + PostgreSQL (backend) · Next.js 15 App Router + Zustand + TanStack Query + Tailwind (frontend)

---

## Quick Start

### Prasyarat

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- [Go](https://go.dev/dl/) 1.22+
- [Bun](https://bun.sh/) 1.x (frontend package manager)

### 1. Clone & environment

```bash
git clone <YOUR_PUBLIC_REPO_URL>
cd seapedia

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### 2. Jalankan database

```bash
docker compose up -d postgres
```

### 3. Migrasi & seed data demo

```bash
cd backend
make migrate-up    # atau: psql $DATABASE_URL -f migrations/001_initial.up.sql
make seed          # 4 akun demo + toko + produk + voucher DISC20
```

### 4. Backend API

```bash
cd backend
make run           # http://localhost:8080
```

Swagger UI: **http://localhost:8080/swagger/index.html**

### 5. Frontend

```bash
cd frontend
bun install
bun run dev        # http://localhost:3000
```

### Alternatif: full Docker

```bash
# Pastikan backend/.env dan frontend/.env.local sudah ada
docker compose up --build
```

---

## Demo Accounts

| Email | Password | Role | Catatan |
|-------|----------|------|---------|
| `admin@seapedia.com` | `admin123` | ADMIN | Monitoring & advance-day |
| `seller@seapedia.com` | `seller123` | SELLER | Toko Contoh + 3 produk |
| `buyer@seapedia.com` | `buyer123` | BUYER | Saldo Rp 500.000 |
| `driver@seapedia.com` | `driver123` | DRIVER | — |

**Voucher demo:** `DISC20` (diskon 20%)

Setiap peran punya akun terpisah (Admin, Seller, Buyer, Driver). Register multi-role masih didukung lewat `/register`, tapi demo memakai akun single-role.

### Cara membuat Admin

Admin **tidak bisa** self-register. Buat via seed:

```bash
cd backend && make seed
```

Akun `admin@seapedia.com` dibuat otomatis. Untuk admin baru, tambahkan di `backend/seed/seed.go` dengan role `user.RoleAdmin`, lalu jalankan seed lagi (skip jika email sudah ada).

---

## Environment Variables

### `backend/.env`

| Variable | Default | Keterangan |
|----------|---------|------------|
| `PORT` | `8080` | Port API |
| `ENV` | `development` | `development` / `production` |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USER` | `seapedia` | DB user |
| `DB_PASSWORD` | `seapedia123` | DB password |
| `DB_NAME` | `seapedia_db` | Database name |
| `DB_SSLMODE` | `disable` | SSL mode |
| `JWT_SECRET` | *(ubah di prod!)* | Min 32 karakter |
| `JWT_EXPIRY` | `24h` | Token expiry |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed origins |

### `frontend/.env.local`

| Variable | Default |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080/api/v1` |

---

## API Documentation

| Resource | URL / Path |
|----------|------------|
| **Swagger UI** | http://localhost:8080/swagger/index.html |
| **OpenAPI JSON** | `backend/docs/swagger.json` |
| **Postman** | `docs/postman/SEAPEDIA.postman_collection.json` |

Regenerate Swagger setelah ubah handler:

```bash
cd backend && make swag
```

---

## Business Rules (ringkas)

### Checkout formula

```
subtotal      = Σ(harga × qty)
taxable_base  = subtotal - diskon
tax_amount    = floor(taxable_base × 12%)
total         = taxable_base + tax_amount + ongkir
```

### Order status flow

`SEDANG_DIKEMAS` → `MENUNGGU_PENGIRIM` → `SEDANG_DIKIRIM` → `PESANAN_SELESAI` (atau `DIKEMBALIKAN` jika overdue)

### Delivery methods

| Method | Estimasi | Ongkir |
|--------|----------|--------|
| INSTANT | 1 hari | Rp 25.000 |
| NEXT_DAY | 2 hari | Rp 15.000 |
| REGULAR | 5 hari | Rp 10.000 |

### End-to-end demo flow

1. **Buyer** login → belanja → checkout (opsional: `DISC20`)
2. **Seller** login → Pesanan → **Siap Kirim**
3. **Driver** login → Ambil pekerjaan → Selesaikan
4. **Admin** → Advance Day (uji overdue refund)

---

## Security

Lihat **[SECURITY.md](./SECURITY.md)** untuk penjelasan lengkap: SQL injection, XSS, session/JWT, RBAC.

---

## Testing

```bash
# Frontend build
cd frontend && bun run build

# Backend tests
cd backend && make test
```

---

## Project Structure

```
seapedia/
├── backend/          # Go Fiber API (clean architecture)
├── frontend/         # Next.js 15 App Router
├── docs/postman/     # Postman collection
├── docker-compose.yml
├── README.md
├── SECURITY.md
└── SEAPEDIA_CLAUDE.md  # Arsitektur & ADR lengkap (dev reference)
```

---

## Deployment (Optional +15 pts)

**Production URLs:**

| Service | URL |
|---------|-----|
| Frontend | https://seapedia.fe.bagusbimawan.com |
| API | https://seapedia.be.bagusbimawan.com/api/v1 |
| Swagger | https://seapedia.be.bagusbimawan.com/swagger/index.html |

Deploy sudah dikonfigurasi di server production. Setelah `git pull`, jalankan ulang deploy dari server (script deploy ada di server, tidak di repo).

**DNS A-record** (arahkan ke IP EC2):

| Host | Value |
|------|-------|
| `seapedia.fe.bagusbimawan.com` | `<IP-EC2>` |
| `seapedia.be.bagusbimawan.com` | `<IP-EC2>` |

---

## License

COMPFEST 18 — Software Engineering Academy submission.
