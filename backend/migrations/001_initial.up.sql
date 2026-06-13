-- SEAPEDIA Initial Migration
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username    VARCHAR(100) UNIQUE NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    phone       VARCHAR(20),
    password_hash TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles
CREATE TABLE IF NOT EXISTS user_roles (
    id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role    VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN','SELLER','BUYER','DRIVER')),
    UNIQUE (user_id, role)
);

-- Addresses
CREATE TABLE IF NOT EXISTS addresses (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label       VARCHAR(100),
    street      TEXT,
    city        VARCHAR(100),
    zip_code    VARCHAR(10),
    is_default  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Stores
CREATE TABLE IF NOT EXISTS stores (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_user_id  UUID UNIQUE NOT NULL REFERENCES users(id),
    name            VARCHAR(200) UNIQUE NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id    UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    price       BIGINT NOT NULL CHECK (price >= 0),
    stock       INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Wallets
CREATE TABLE IF NOT EXISTS wallets (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID UNIQUE NOT NULL REFERENCES users(id),
    balance     BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet Transactions
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id       UUID NOT NULL REFERENCES wallets(id),
    type            VARCHAR(20) NOT NULL CHECK (type IN ('TOPUP','PAYMENT','REFUND')),
    amount          BIGINT NOT NULL,
    balance_after   BIGINT NOT NULL,
    ref_order_id    UUID NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Carts
CREATE TABLE IF NOT EXISTS carts (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID UNIQUE NOT NULL REFERENCES users(id),
    store_id    UUID NULL REFERENCES stores(id),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Cart Items
CREATE TABLE IF NOT EXISTS cart_items (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id     UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id  UUID NOT NULL REFERENCES products(id),
    quantity    INT NOT NULL CHECK (quantity > 0),
    UNIQUE (cart_id, product_id),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Discounts
CREATE TABLE IF NOT EXISTS discounts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code            VARCHAR(50) UNIQUE,
    kind            VARCHAR(20) NOT NULL CHECK (kind IN ('VOUCHER','PROMO')),
    discount_type   VARCHAR(20) NOT NULL CHECK (discount_type IN ('PERCENT','FIXED')),
    discount_value  BIGINT NOT NULL CHECK (discount_value > 0),
    expiry_date     TIMESTAMPTZ,
    remaining_usage INT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_user_id       UUID NOT NULL REFERENCES users(id),
    store_id            UUID NOT NULL REFERENCES stores(id),
    discount_id         UUID NULL REFERENCES discounts(id),
    address_snapshot    JSONB NOT NULL DEFAULT '{}',
    delivery_method     VARCHAR(20) NOT NULL CHECK (delivery_method IN ('INSTANT','NEXT_DAY','REGULAR')),
    subtotal            BIGINT NOT NULL DEFAULT 0,
    discount_amount     BIGINT NOT NULL DEFAULT 0,
    tax_amount          BIGINT NOT NULL DEFAULT 0,
    delivery_fee        BIGINT NOT NULL DEFAULT 0,
    total               BIGINT NOT NULL DEFAULT 0,
    status              VARCHAR(30) NOT NULL DEFAULT 'SEDANG_DIKEMAS'
                            CHECK (status IN ('SEDANG_DIKEMAS','MENUNGGU_PENGIRIM','SEDANG_DIKIRIM','PESANAN_SELESAI','DIKEMBALIKAN')),
    deadline_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id),
    name_snapshot   VARCHAR(255) NOT NULL,
    price_snapshot  BIGINT NOT NULL,
    quantity        INT NOT NULL CHECK (quantity > 0)
);

-- Order Status History
CREATE TABLE IF NOT EXISTS order_status_history (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status      VARCHAR(30) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery Jobs
CREATE TABLE IF NOT EXISTS delivery_jobs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID UNIQUE NOT NULL REFERENCES orders(id),
    driver_user_id  UUID NULL REFERENCES users(id),
    earning_amount  BIGINT NOT NULL DEFAULT 0,
    taken_at        TIMESTAMPTZ NULL,
    completed_at    TIMESTAMPTZ NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Seller Incomes
CREATE TABLE IF NOT EXISTS seller_incomes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id    UUID NOT NULL REFERENCES stores(id),
    order_id    UUID NOT NULL REFERENCES orders(id),
    type        VARCHAR(20) NOT NULL CHECK (type IN ('INCOME','REVERSAL')),
    amount      BIGINT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- App Reviews
CREATE TABLE IF NOT EXISTS app_reviews (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reviewer_name   VARCHAR(100) NOT NULL,
    rating          INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    user_id         UUID NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- System Clock (virtual clock for time manipulation)
CREATE TABLE IF NOT EXISTS system_clock (
    id              INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    offset_hours    BIGINT NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Seed system_clock with single row
INSERT INTO system_clock (id, offset_hours, updated_at)
VALUES (1, 0, NOW())
ON CONFLICT (id) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_user_id ON orders(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_deadline_at ON orders(deadline_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_jobs_driver_user_id ON delivery_jobs(driver_user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_jobs_order_id ON delivery_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_seller_incomes_store_id ON seller_incomes(store_id);
CREATE INDEX IF NOT EXISTS idx_seller_incomes_order_id ON seller_incomes(order_id);
CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts(code);
CREATE INDEX IF NOT EXISTS idx_discounts_kind ON discounts(kind);
