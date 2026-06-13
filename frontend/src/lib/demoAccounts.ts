export interface DemoAccount {
  role: string
  email: string
  password: string
  note?: string
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'Admin', email: 'admin@seapedia.com', password: 'admin123' },
  { role: 'Seller', email: 'seller@seapedia.com', password: 'seller123', note: 'Sudah punya toko + 3 produk' },
  { role: 'Buyer', email: 'buyer@seapedia.com', password: 'buyer123', note: 'Saldo Rp 500.000' },
  { role: 'Driver', email: 'driver@seapedia.com', password: 'driver123' },
  { role: 'Multi-role', email: 'multi@seapedia.com', password: 'multi123', note: 'Seller + Buyer + Driver — saldo Rp 500k, bisa ganti peran' },
]

export const DEMO_VOUCHER = { code: 'DISC20', desc: 'Diskon 20%' }
