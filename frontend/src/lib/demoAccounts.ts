export interface DemoAccount {
  role: string
  email: string
  password: string
  note?: string
}

/** Akun demo tetap — Admin, Buyer, Driver saja. Seller dari admin via API. */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'Admin', email: 'admin@seapedia.com', password: 'admin123' },
  { role: 'Buyer', email: 'buyer@seapedia.com', password: 'buyer123', note: 'Saldo Rp 500.000' },
  { role: 'Driver', email: 'driver@seapedia.com', password: 'driver123' },
]

export const DEMO_VOUCHER = { code: 'DISC20', desc: 'Diskon 20%' }
