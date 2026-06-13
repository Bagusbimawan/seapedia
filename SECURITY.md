# Security Notes — SEAPEDIA

Dokumen ini menjelaskan bagaimana SEAPEDIA menangani ancaman keamanan umum sesuai requirement delivery COMPFEST 18.

---

## 1. SQL Injection

**Mitigasi: GORM parameterized queries**

Semua query database menggunakan GORM dengan placeholder binding — **tidak ada** string concatenation untuk SQL.

```go
// ✅ Aman — parameter ter-bind
db.Where("email = ?", email).First(&user)
db.Where("UPPER(code) = ?", normalizedCode).First(&discount)

// ✅ Atomic update dengan placeholder
db.Exec("UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?", qty, id, qty)
```

Operasi kritis (stock decrement, take job) memakai `RowsAffected` check untuk mencegah race condition tanpa raw SQL injection risk.

---

## 2. XSS (Cross-Site Scripting)

**Mitigasi: Bluemonday sanitization + output encoding**

| Layer | Perlindungan |
|-------|-------------|
| **Review comment** | `bluemonday.StrictPolicy().Sanitize()` sebelum insert ke DB |
| **API response** | JSON encoding otomatis (Fiber) — HTML tidak di-render server-side |
| **Frontend** | React/Next.js auto-escape JSX; tidak pakai `dangerouslySetInnerHTML` |

```go
// backend/internal/usecase/review/review_usecase.go
req.Comment = sanitizePolicy.Sanitize(req.Comment)
```

---

## 3. Session & Authentication

**Model: Stateless JWT (bukan server-side session)**

| Aspek | Implementasi |
|-------|-------------|
| **Token** | JWT HS256, signed dengan `JWT_SECRET` (min 32 char) |
| **Expiry** | `JWT_EXPIRY` (default 24h) — diverifikasi di setiap request |
| **Storage FE** | Zustand persist + httpOnly-equivalent via cookie `seapedia-token` untuk middleware |
| **Logout** | Clear token + cookie; tidak ada session server-side yang perlu di-invalidate |
| **401** | Axios interceptor clear auth & redirect ke `/login` |

**Active role** disimpan di JWT claim `active_role` — berubah saat `POST /auth/switch-role` dengan token baru.

**Bukan** session cookie klasik — setiap request membawa Bearer token yang diverifikasi signature + expiry.

---

## 4. RBAC (Role-Based Access Control)

**Dua lapis: Backend middleware + Frontend route guard**

### Backend

```go
// middleware/auth.go — validasi JWT, set Locals user_id + active_role
// middleware/role.go — RequireRole(user.RoleBuyer, ...)
```

| Route group | Role required |
|-------------|---------------|
| `/seller/*` | SELLER |
| `/buyer/*` | BUYER |
| `/driver/*` | DRIVER |
| `/admin/*` | ADMIN |

**Ownership checks** di usecase layer:
- Seller hanya akses store & produk miliknya (`seller_user_id` match)
- Buyer hanya akses cart/wallet/order sendiri (`user_id` dari JWT)
- Driver hanya take/complete job yang available atau miliknya

### Frontend

- `middleware.ts` — redirect jika tidak ada token / role PENDING / akses dashboard role lain
- Dashboard layout per role (`/buyer`, `/seller`, `/driver`, `/admin`)

**Admin tidak bisa self-register** — dicegah di `auth_usecase.Register`.

---

## 5. Input Validation

Semua request body divalidasi via `go-playground/validator` tags di DTO:

```go
type RegisterReq struct {
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required,min=6"`
    Roles    []string `json:"roles" validate:"required,min=1,dive,oneof=BUYER SELLER DRIVER"`
}
```

Frontend: `react-hook-form` + `zod` schema untuk validasi client-side.

---

## 6. CORS

Origin dibatasi via env `CORS_ORIGINS` — default `http://localhost:3000`.

---

## 7. Password Storage

Bcrypt cost 12 via `golang.org/x/crypto/bcrypt` — password tidak pernah disimpan plaintext.

---

## 8. Atomic Operations (Business Security)

| Operasi | Mekanisme |
|---------|-----------|
| Stock decrement | `UPDATE ... WHERE stock >= ?` + `RowsAffected` |
| Take delivery job | `UPDATE ... WHERE driver_user_id IS NULL` |
| Wallet debit/credit | GORM transaction |
| Overdue refund | Re-fetch order + check terminal status (idempotency) |

---

## Reporting Issues

Untuk kompetisi, hubungi tim via issue GitHub repository public.
